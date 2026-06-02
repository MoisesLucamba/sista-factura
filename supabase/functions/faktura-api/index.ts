// Faktura Public API — REST endpoints for external platforms
// Auth: header `x-api-key: fkt_live_...`
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // path after /functions/v1/faktura-api
  const path = url.pathname.replace(/^.*\/faktura-api/, '') || '/';

  // Public: health
  if (path === '/health' || path === '/v1/health') {
    return json({ ok: true, service: 'faktura-api', version: '1.0' });
  }

  // Auth via API key
  const apiKey = req.headers.get('x-api-key') || '';
  if (!apiKey.startsWith('fkt_')) {
    return json({ error: 'Missing or invalid x-api-key' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const keyHash = await sha256Hex(apiKey);
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id, is_active, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (!keyRow || !keyRow.is_active || keyRow.revoked_at) {
    return json({ error: 'API key not found or revoked' }, 401);
  }
  const userId = keyRow.user_id as string;

  // Touch last_used_at (best-effort)
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash).then(() => {});

  try {
    // ── GET /v1/clients ──────────────────────────────
    if (req.method === 'GET' && path === '/v1/clients') {
      const { data, error } = await supabase.from('clientes').select('*').eq('user_id', userId).limit(200);
      if (error) throw error;
      return json({ data });
    }

    // ── POST /v1/clients ─────────────────────────────
    if (req.method === 'POST' && path === '/v1/clients') {
      const body = await req.json();
      if (!body?.nome) return json({ error: 'nome is required' }, 400);
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

    // ── GET /v1/products ─────────────────────────────
    if (req.method === 'GET' && path === '/v1/products') {
      const { data, error } = await supabase.from('produtos').select('*').eq('user_id', userId).limit(500);
      if (error) throw error;
      return json({ data });
    }

    // ── GET /v1/invoices ─────────────────────────────
    if (req.method === 'GET' && path === '/v1/invoices') {
      const { data, error } = await supabase
        .from('faturas')
        .select('id, numero, tipo, estado, data_emissao, total, total_iva, hash_extracto, cliente_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return json({ data });
    }

    // ── GET /v1/invoices/:id ─────────────────────────
    const invoiceMatch = path.match(/^\/v1\/invoices\/([0-9a-f-]{36})$/i);
    if (req.method === 'GET' && invoiceMatch) {
      const id = invoiceMatch[1];
      const { data: fatura, error } = await supabase
        .from('faturas').select('*, cliente:clientes(*)')
        .eq('id', id).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (!fatura) return json({ error: 'Invoice not found' }, 404);
      const { data: itens } = await supabase.from('itens_fatura').select('*, produto:produtos(*)').eq('fatura_id', id);
      return json({ data: { ...fatura, itens: itens || [] } });
    }

    // ── POST /v1/invoices ────────────────────────────
    if (req.method === 'POST' && path === '/v1/invoices') {
      const body = await req.json();
      // Required: cliente_id, itens[{produto_id, quantidade, preco_unitario, taxa_iva}]
      if (!body?.cliente_id || !Array.isArray(body?.itens) || body.itens.length === 0) {
        return json({ error: 'cliente_id and itens[] required' }, 400);
      }

      const tipo = body.tipo || 'fatura';
      const serieMap: Record<string, string> = {
        fatura: 'FT', 'fatura-recibo': 'FR', recibo: 'RC',
        'nota-credito': 'NC', 'nota-debito': 'ND',
        'fatura-global': 'FG', 'fatura-generica': 'FGe',
        'auto-faturacao': 'AF', proforma: 'PF', orcamento: 'OR', 'guia-remessa': 'GR',
      };
      const serie = serieMap[tipo] || 'FT';

      const { data: numero, error: nErr } = await supabase.rpc('generate_invoice_number', { _user_id: userId, _serie: serie });
      if (nErr) throw nErr;

      // Compute item totals server-side
      const itens = body.itens.map((it: any) => {
        const qty = Number(it.quantidade || 1);
        const price = Number(it.preco_unitario || 0);
        const taxa = Number(it.taxa_iva ?? 14);
        const desc = Number(it.desconto || 0);
        const subBruto = qty * price;
        const subtotal = subBruto * (1 - desc / 100);
        const valor_iva = subtotal * (taxa / 100);
        return {
          produto_id: it.produto_id,
          quantidade: qty,
          preco_unitario: Number(price.toFixed(4)),
          desconto: desc,
          taxa_iva: taxa,
          subtotal,
          valor_iva,
          total: subtotal + valor_iva,
          tax_exemption_code: it.tax_exemption_code || null,
          tax_exemption_reason: it.tax_exemption_reason || null,
        };
      });

      const subtotal = itens.reduce((s: number, x: any) => s + x.subtotal, 0);
      const total_iva = itens.reduce((s: number, x: any) => s + x.valor_iva, 0);
      const total = itens.reduce((s: number, x: any) => s + x.total, 0);
      const dataEmissao = body.data_emissao || new Date().toISOString().split('T')[0];
      const dataVencimento = body.data_vencimento || dataEmissao;

      const { data: fatura, error: fErr } = await supabase.from('faturas').insert({
        user_id: userId,
        numero,
        serie,
        tipo,
        estado: body.estado || 'emitida',
        cliente_id: body.cliente_id,
        data_emissao: dataEmissao,
        data_vencimento: dataVencimento,
        subtotal,
        total_iva,
        total,
        observacoes: body.observacoes || null,
        metodo_pagamento: body.metodo_pagamento || null,
        moeda: body.moeda || 'AOA',
        taxa_cambio: body.taxa_cambio || 1,
        is_locked: (body.estado || 'emitida') === 'emitida',
        incluir_saft: tipo !== 'proforma' && tipo !== 'orcamento',
        periodo_contabilistico: dataEmissao.substring(0, 7),
      }).select().single();
      if (fErr) throw fErr;

      const itensRows = itens.map((x: any) => ({ ...x, fatura_id: fatura.id }));
      const { error: iErr } = await supabase.from('itens_fatura').insert(itensRows);
      if (iErr) throw iErr;

      return json({ data: fatura }, 201);
    }

    return json({ error: 'Not found', path }, 404);
  } catch (e: any) {
    return json({ error: e.message || 'Internal error' }, 500);
  }
});
