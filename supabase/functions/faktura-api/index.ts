// Faktura Public API v1 — invoicing, marketplace commissions, SAF-T, PDF downloads.
// Auth: header `x-api-key: fkt_live_...`
// Marketplace impersonation: header `x-on-behalf-of: FK-244-XXXXXX`
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-api-key, x-client-info, apikey, content-type, x-on-behalf-of, x-idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const SERIE_MAP: Record<string, string> = {
  fatura: 'FT', 'fatura-recibo': 'FR', recibo: 'RC',
  'nota-credito': 'NC', 'nota-debito': 'ND',
  'fatura-global': 'FG', 'fatura-generica': 'FGe',
  'auto-faturacao': 'AF', proforma: 'PF', orcamento: 'OR', 'guia-remessa': 'GR',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/faktura-api/, '') || '/';

  // Public health
  if (path === '/health' || path === '/v1/health') {
    return json({ ok: true, service: 'faktura-api', version: '1.0' });
  }

  const apiKey = req.headers.get('x-api-key') || '';
  if (!apiKey.startsWith('fkt_')) {
    return json({ error: 'Missing or invalid x-api-key', code: 'unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const keyHash = await sha256Hex(apiKey);
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (!keyRow || !keyRow.is_active || keyRow.revoked_at) {
    return json({ error: 'API key not found or revoked', code: 'unauthorized' }, 401);
  }
  let userId = keyRow.user_id as string;
  const keyId = keyRow.id as string;
  const t0 = Date.now();

  // best-effort last_used_at
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash).then(() => {});

  // Optional marketplace impersonation via x-on-behalf-of: FK-244-XXXXXX
  const onBehalfOf = req.headers.get('x-on-behalf-of');
  if (onBehalfOf && onBehalfOf.startsWith('FK-244-')) {
    const { data: target } = await supabase
      .from('profiles').select('user_id').eq('faktura_id', onBehalfOf).maybeSingle();
    if (!target) return json({ error: 'on-behalf-of user not found', code: 'not_found' }, 404);
    userId = target.user_id as string;
  }

  const response: Response = await (async () => {
    try {

    // ── 4.2 GET /v1/lookup/:fk_id ──────────────────────────────
    const lookupMatch = path.match(/^\/v1\/lookup\/(FK-244-[0-9]{6})$/);
    if (req.method === 'GET' && lookupMatch) {
      const fkId = lookupMatch[1];
      const { data, error } = await supabase.rpc('lookup_profile_by_faktura_id', { _faktura_id: fkId });
      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return json({ error: 'Faktura ID not found', code: 'not_found' }, 404);
      }
      const row = Array.isArray(data) ? data[0] : data;
      return json({ data: { faktura_id: fkId, ...row } });
    }

    // ── 4.3 Clients ─────────────────────────────────────────
    if (req.method === 'GET' && path === '/v1/clients') {
      const { data, error } = await supabase.from('clientes').select('*').eq('user_id', userId).limit(200);
      if (error) throw error;
      return json({ data });
    }
    if (req.method === 'POST' && path === '/v1/clients') {
      const body = await req.json();
      if (!body?.nome) return json({ error: 'nome is required', code: 'invalid_body' }, 400);
      const { data, error } = await supabase.from('clientes').insert({
        user_id: userId,
        nome: body.nome,
        nif: body.nif || '',
        endereco: body.endereco || 'N/A',
        telefone: body.telefone || null,
        email: body.email || null,
        tipo: body.tipo || 'particular',
      }).select().single();
      if (error) throw error;
      return json({ data }, 201);
    }

    // ── 4.4 Products ────────────────────────────────────────
    if (req.method === 'GET' && path === '/v1/products') {
      const { data, error } = await supabase.from('produtos').select('*').eq('user_id', userId).limit(500);
      if (error) throw error;
      return json({ data });
    }
    if (req.method === 'POST' && path === '/v1/products') {
      const body = await req.json();
      if (!body?.nome) return json({ error: 'nome is required', code: 'invalid_body' }, 400);
      const { data, error } = await supabase.from('produtos').insert({
        user_id: userId,
        nome: body.nome,
        codigo: body.codigo || body.nome.substring(0, 20),
        tipo: body.tipo || 'servico',
        preco_unitario: Number(body.preco_unitario || 0),
        unidade: body.unidade || 'un',
        taxa_iva: Number(body.taxa_iva ?? 14),
        iva_incluido: !!body.iva_incluido,
      }).select().single();
      if (error) throw error;
      return json({ data }, 201);
    }

    // ── 4.7 GET /v1/invoices (list) ─────────────────────────
    if (req.method === 'GET' && path === '/v1/invoices') {
      const p = url.searchParams;
      let q = supabase.from('faturas')
        .select('id, numero, tipo, estado, data_emissao, total, total_iva, hash_extracto, cliente_id, buyer_user_id')
        .eq('user_id', userId).order('created_at', { ascending: false })
        .limit(Math.min(Number(p.get('limit') || 100), 200));
      if (p.get('from')) q = q.gte('data_emissao', p.get('from')!);
      if (p.get('to')) q = q.lte('data_emissao', p.get('to')!);
      if (p.get('tipo')) q = q.eq('tipo', p.get('tipo')!);
      if (p.get('estado')) q = q.eq('estado', p.get('estado')!);
      if (p.get('buyer')?.startsWith('FK-244-')) {
        const { data: buyer } = await supabase.from('profiles')
          .select('user_id').eq('faktura_id', p.get('buyer')!).maybeSingle();
        if (buyer) q = q.eq('buyer_user_id', buyer.user_id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return json({ data });
    }

    // ── 4.7 GET /v1/invoices/:id ────────────────────────────
    const invoiceMatch = path.match(/^\/v1\/invoices\/([0-9a-f-]{36})$/i);
    if (req.method === 'GET' && invoiceMatch) {
      const id = invoiceMatch[1];
      const { data: fatura, error } = await supabase
        .from('faturas').select('*, cliente:clientes(*)')
        .eq('id', id).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (!fatura) return json({ error: 'Invoice not found', code: 'not_found' }, 404);
      const { data: itens } = await supabase.from('itens_fatura')
        .select('*, produto:produtos(*)').eq('fatura_id', id);
      return json({ data: { ...fatura, itens: itens || [] } });
    }

    // ── 4.8 GET /v1/invoices/:id/pdf ────────────────────────
    const pdfMatch = path.match(/^\/v1\/invoices\/([0-9a-f-]{36})\/pdf$/i);
    if (req.method === 'GET' && pdfMatch) {
      const id = pdfMatch[1];
      const { data: fatura } = await supabase
        .from('faturas').select('id, user_id, buyer_user_id, numero')
        .eq('id', id).maybeSingle();
      if (!fatura) return json({ error: 'Invoice not found', code: 'not_found' }, 404);
      // Owner or buyer can download
      if (fatura.user_id !== userId && fatura.buyer_user_id !== userId) {
        return json({ error: 'Forbidden', code: 'forbidden' }, 403);
      }
      const objectPath = `${fatura.user_id}/${fatura.id}.pdf`;
      const { data: signed, error: sErr } = await supabase.storage
        .from('invoices').createSignedUrl(objectPath, 3600);
      if (sErr || !signed) {
        return json({
          error: 'PDF not yet generated. Trigger PDF generation from the app.',
          code: 'pdf_not_ready',
          numero: fatura.numero,
        }, 404);
      }
      if (url.searchParams.get('redirect') === 'false') {
        return json({ data: { url: signed.signedUrl, expires_in: 3600 } });
      }
      return Response.redirect(signed.signedUrl, 302);
    }

    // ── 4.9 GET /v1/saft/:period ────────────────────────────
    const saftMatch = path.match(/^\/v1\/saft\/(\d{4}-\d{2})$/);
    if (req.method === 'GET' && saftMatch) {
      const period = saftMatch[1];
      // Look for an existing submission record first
      const { data: sub } = await supabase.from('saft_submissions')
        .select('xml_url, status').eq('user_id', userId).eq('period', period).maybeSingle();
      if (sub?.xml_url) {
        const { data: signed } = await supabase.storage
          .from('saft').createSignedUrl(sub.xml_url, 3600);
        if (signed) {
          if (url.searchParams.get('redirect') === 'false') {
            return json({ data: { url: signed.signedUrl, status: sub.status } });
          }
          return Response.redirect(signed.signedUrl, 302);
        }
      }
      return json({
        error: 'SAF-T for this period not yet generated. It is produced automatically on day 5 of each month, or trigger from the app.',
        code: 'saft_not_ready',
        period,
      }, 404);
    }

    // ── 4.5 POST /v1/invoices ───────────────────────────────
    if (req.method === 'POST' && path === '/v1/invoices') {
      const body = await req.json();
      const itens = Array.isArray(body?.itens) ? body.itens : [];
      if (itens.length === 0) return json({ error: 'itens[] required', code: 'invalid_body' }, 400);

      // Resolve buyer by faktura_id if provided
      let clienteId: string | null = body.cliente_id || null;
      let buyerUserId: string | null = null;
      if (body.buyer_faktura_id?.startsWith?.('FK-244-')) {
        const { data: buyer } = await supabase.from('profiles')
          .select('user_id, nome, nif, telefone, email')
          .eq('faktura_id', body.buyer_faktura_id).maybeSingle();
        if (!buyer) return json({ error: 'buyer_faktura_id not found', code: 'not_found' }, 404);
        buyerUserId = buyer.user_id;
        if (!clienteId) {
          // find-or-create matching cliente row for the seller
          const { data: existing } = await supabase.from('clientes')
            .select('id').eq('user_id', userId).eq('nif', buyer.nif || '').maybeSingle();
          if (existing) clienteId = existing.id;
          else {
            const { data: novo } = await supabase.from('clientes').insert({
              user_id: userId, nome: buyer.nome,
              nif: buyer.nif || '', endereco: 'N/A',
              telefone: buyer.telefone, email: buyer.email,
              tipo: 'particular',
            }).select('id').single();
            clienteId = novo?.id || null;
          }
        }
      }
      if (!clienteId) return json({ error: 'cliente_id or buyer_faktura_id required', code: 'invalid_body' }, 400);

      const tipo = body.tipo || 'fatura';
      const serie = SERIE_MAP[tipo] || 'FT';
      const { data: numero, error: nErr } = await supabase.rpc('generate_invoice_number', { _user_id: userId, _serie: serie });
      if (nErr) throw nErr;

      const computed = itens.map((it: any) => {
        const qty = Number(it.quantidade || 1);
        const price = Number(it.preco_unitario || 0);
        const taxa = Number(it.taxa_iva ?? 14);
        const desc = Number(it.desconto || 0);
        const subtotal = qty * price * (1 - desc / 100);
        const valor_iva = subtotal * (taxa / 100);
        return {
          produto_id: it.produto_id, quantidade: qty,
          preco_unitario: Number(price.toFixed(4)),
          desconto: desc, taxa_iva: taxa,
          subtotal, valor_iva, total: subtotal + valor_iva,
          tax_exemption_code: it.tax_exemption_code || null,
          tax_exemption_reason: it.tax_exemption_reason || null,
        };
      });

      const subtotal = computed.reduce((s: number, x: any) => s + x.subtotal, 0);
      const total_iva = computed.reduce((s: number, x: any) => s + x.valor_iva, 0);
      const total = computed.reduce((s: number, x: any) => s + x.total, 0);
      const dataEmissao = body.data_emissao || new Date().toISOString().split('T')[0];
      const dataVencimento = body.data_vencimento || dataEmissao;

      const { data: fatura, error: fErr } = await supabase.from('faturas').insert({
        user_id: userId,
        buyer_user_id: buyerUserId,
        numero, serie, tipo,
        estado: body.estado || 'emitida',
        cliente_id: clienteId,
        data_emissao: dataEmissao,
        data_vencimento: dataVencimento,
        subtotal, total_iva, total,
        observacoes: body.observacoes || null,
        metodo_pagamento: body.metodo_pagamento || null,
        moeda: body.moeda || 'AOA',
        taxa_cambio: body.taxa_cambio || 1,
        is_locked: (body.estado || 'emitida') === 'emitida',
        incluir_saft: tipo !== 'proforma' && tipo !== 'orcamento',
        periodo_contabilistico: dataEmissao.substring(0, 7),
      }).select().single();
      if (fErr) throw fErr;

      const itensRows = computed.map((x: any) => ({ ...x, fatura_id: fatura.id }));
      const { error: iErr } = await supabase.from('itens_fatura').insert(itensRows);
      if (iErr) throw iErr;

      return json({
        data: {
          ...fatura,
          pdf_url: `${url.origin}/functions/v1/faktura-api/v1/invoices/${fatura.id}/pdf`,
        },
      }, 201);
    }

    // ── 4.6 POST /v1/marketplace/commission-invoice ─────────
    if (req.method === 'POST' && path === '/v1/marketplace/commission-invoice') {
      const body = await req.json();
      if (!body?.seller_faktura_id?.startsWith?.('FK-244-')) {
        return json({ error: 'seller_faktura_id required (FK-244-XXXXXX)', code: 'invalid_body' }, 400);
      }
      const gross = Number(body.gross_amount || 0);
      const rate = body.commission_rate != null ? Number(body.commission_rate) : null;
      const flat = body.commission_amount != null ? Number(body.commission_amount) : null;
      if (!(rate != null || flat != null)) {
        return json({ error: 'commission_rate or commission_amount required', code: 'invalid_body' }, 400);
      }
      const commissionBase = flat != null ? flat : gross * (rate as number);
      const taxa = Number(body.taxa_iva ?? 14);
      const iva = commissionBase * (taxa / 100);
      const total = commissionBase + iva;

      const { data: seller } = await supabase.from('profiles')
        .select('user_id, nome, nif, telefone, email')
        .eq('faktura_id', body.seller_faktura_id).maybeSingle();
      if (!seller) return json({ error: 'seller_faktura_id not found', code: 'not_found' }, 404);

      // find-or-create cliente (the seller as marketplace's client)
      let clienteId: string;
      const { data: existing } = await supabase.from('clientes')
        .select('id').eq('user_id', userId).eq('nif', seller.nif || '').maybeSingle();
      if (existing) clienteId = existing.id;
      else {
        const { data: novo, error: cErr } = await supabase.from('clientes').insert({
          user_id: userId, nome: seller.nome, nif: seller.nif || '',
          endereco: 'N/A', telefone: seller.telefone, email: seller.email, tipo: 'empresa',
        }).select('id').single();
        if (cErr) throw cErr;
        clienteId = novo!.id;
      }

      const serie = 'FT';
      const { data: numero, error: nErr } = await supabase.rpc('generate_invoice_number', { _user_id: userId, _serie: serie });
      if (nErr) throw nErr;

      const dataEmissao = body.data_emissao || new Date().toISOString().split('T')[0];

      const { data: fatura, error: fErr } = await supabase.from('faturas').insert({
        user_id: userId,
        buyer_user_id: seller.user_id,
        numero, serie, tipo: 'fatura',
        estado: 'emitida',
        cliente_id: clienteId,
        data_emissao: dataEmissao,
        data_vencimento: dataEmissao,
        subtotal: commissionBase,
        total_iva: iva,
        total,
        observacoes: body.description || `Comissão sobre ${body.order_reference || 'venda'}`,
        moeda: 'AOA', taxa_cambio: 1, is_locked: true, incluir_saft: true,
        periodo_contabilistico: dataEmissao.substring(0, 7),
      }).select().single();
      if (fErr) throw fErr;

      // Single line item representing the commission
      await supabase.from('itens_fatura').insert([{
        fatura_id: fatura.id,
        produto_id: null,
        quantidade: 1,
        preco_unitario: commissionBase,
        desconto: 0,
        taxa_iva: taxa,
        subtotal: commissionBase,
        valor_iva: iva,
        total,
      }]);

      return json({
        data: {
          id: fatura.id,
          numero: fatura.numero,
          commission_base: commissionBase,
          iva,
          total,
          seller_faktura_id: body.seller_faktura_id,
          order_reference: body.order_reference || null,
          pdf_url: `${url.origin}/functions/v1/faktura-api/v1/invoices/${fatura.id}/pdf`,
        },
      }, 201);
    }

    return json({ error: 'Not found', code: 'not_found', path }, 404);
    } catch (e: any) {
      return json({ error: e.message || 'Internal error', code: 'internal_error' }, 500);
    }
  })();

  // Fire-and-forget usage log
  supabase.from('api_usage_logs').insert({
    api_key_id: keyId,
    user_id: userId,
    endpoint: path,
    method: req.method,
    status: response.status,
    latency_ms: Date.now() - t0,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: req.headers.get('user-agent') || null,
  }).then(() => {});

  return response;
});

