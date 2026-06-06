// Generates SAF-T XML for previous month for each user and submits to AGT.
// If AGT_SAFT_ENDPOINT is missing, runs in dry-run mode (xml stored, status=pending).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function esc(s: any) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function num(n: any, d = 2) { return Number(n || 0).toFixed(d); }

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildSaftXml(supabase: any, userId: string, periodStart: string, periodEnd: string) {
  const { data: agt } = await supabase.from('agt_config').select('*').eq('user_id', userId).maybeSingle();
  const { data: faturas } = await supabase
    .from('faturas').select('*, cliente:clientes(*)')
    .eq('user_id', userId).eq('incluir_saft', true)
    .gte('data_emissao', periodStart).lte('data_emissao', periodEnd);
  const fids = (faturas || []).map((f: any) => f.id);
  let itens: any[] = [];
  if (fids.length) {
    const { data } = await supabase.from('itens_fatura').select('*, produto:produtos(*)').in('fatura_id', fids);
    itens = data || [];
  }
  const compName = esc(agt?.nome_empresa || 'Empresa');
  const compNif = esc(agt?.nif_produtor || '');
  const year = periodStart.substring(0, 4);

  let totalCredit = 0;
  const invoiceXml = (faturas || []).map((f: any) => {
    const status = f.estado === 'anulada' ? 'A' : 'N';
    const linesXml = itens.filter(it => it.fatura_id === f.id).map((it: any, i: number) => {
      const desc = Number(it.desconto || 0);
      const unitPriceNet = Number(it.preco_unitario || 0) * (1 - desc / 100);
      return `<Line><LineNumber>${i + 1}</LineNumber><ProductCode>${esc(it.produto?.codigo || '')}</ProductCode><ProductDescription>${esc(it.produto?.nome || '')}</ProductDescription><Quantity>${num(it.quantidade, 4)}</Quantity><UnitOfMeasure>UN</UnitOfMeasure><UnitPrice>${unitPriceNet.toFixed(4)}</UnitPrice><TaxPointDate>${f.data_emissao}</TaxPointDate><Description>${esc(it.produto?.nome || '')}</Description><CreditAmount>${num(it.subtotal)}</CreditAmount><Tax><TaxType>IVA</TaxType><TaxCountryRegion>AO</TaxCountryRegion><TaxCode>NOR</TaxCode><TaxPercentage>${it.taxa_iva}</TaxPercentage></Tax></Line>`;
    }).join('');
    totalCredit += Number(f.total || 0);
    const sysEntry = f.system_entry_date ? new Date(f.system_entry_date).toISOString().substring(0, 19) : `${f.data_emissao}T00:00:00`;
    return `<Invoice><InvoiceNo>${esc(f.numero)}</InvoiceNo><ATCUD>0</ATCUD><DocumentStatus><InvoiceStatus>${status}</InvoiceStatus><InvoiceStatusDate>${sysEntry}</InvoiceStatusDate><SourceID>${esc(f.user_id)}</SourceID><SourceBilling>P</SourceBilling></DocumentStatus><Hash>${esc(f.hash_doc || '0')}</Hash><HashControl>${esc(f.hash_extracto || '0')}</HashControl><Period>${periodStart.substring(5, 7)}</Period><InvoiceDate>${f.data_emissao}</InvoiceDate><InvoiceType>FT</InvoiceType><SpecialRegimes><SelfBillingIndicator>0</SelfBillingIndicator></SpecialRegimes><SystemEntryDate>${sysEntry}</SystemEntryDate><CustomerID>${esc(f.cliente_id)}</CustomerID>${linesXml}<DocumentTotals><TaxPayable>${num(f.total_iva)}</TaxPayable><NetTotal>${num(f.subtotal)}</NetTotal><GrossTotal>${num(f.total)}</GrossTotal></DocumentTotals></Invoice>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.00_01">
<Header><AuditFileVersion>1.00_01</AuditFileVersion><CompanyID>${compNif}</CompanyID><TaxRegistrationNumber>${compNif}</TaxRegistrationNumber><TaxAccountingBasis>F</TaxAccountingBasis><CompanyName>${compName}</CompanyName><FiscalYear>${year}</FiscalYear><StartDate>${periodStart}</StartDate><EndDate>${periodEnd}</EndDate><CurrencyCode>AOA</CurrencyCode><DateCreated>${new Date().toISOString().substring(0,10)}</DateCreated><TaxEntity>Global</TaxEntity><ProductCompanyTaxID>5002964031</ProductCompanyTaxID><SoftwareCertificateNumber>31</SoftwareCertificateNumber><ProductID>FAKTURA/Faktura</ProductID><ProductVersion>1.0</ProductVersion></Header>
<SourceDocuments><SalesInvoices><NumberOfEntries>${(faturas || []).length}</NumberOfEntries><TotalDebit>0.00</TotalDebit><TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>${invoiceXml}</SalesInvoices></SourceDocuments>
</AuditFile>`;
}

async function submitToAgt(xml: string, hash: string) {
  const endpoint = Deno.env.get('AGT_SAFT_ENDPOINT');
  const token = Deno.env.get('AGT_SAFT_TOKEN');
  if (!endpoint) {
    return { ok: false, dryRun: true, message: 'AGT endpoint não configurado — XML gerado mas não enviado.' };
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Saft-Hash': hash,
      },
      body: xml,
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, message: `AGT ${res.status}: ${text.substring(0, 200)}` };
    let reference = res.headers.get('x-agt-reference') || '';
    try { const j = JSON.parse(text); reference = j.reference || j.ref || reference; } catch {}
    return { ok: true, reference: reference || `AGT-${Date.now()}` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    let targetUserIds: string[] | null = null;
    let periodOverride: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.user_id) targetUserIds = [body.user_id];
        if (body.period) periodOverride = body.period; // YYYY-MM
      } catch {}
    }

    // Period = previous month, or override
    const now = new Date();
    let ps: Date, pe: Date;
    if (periodOverride) {
      const [y, m] = periodOverride.split('-').map(Number);
      ps = new Date(y, m - 1, 1); pe = new Date(y, m, 0);
    } else {
      ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      pe = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    const psStr = ps.toISOString().substring(0, 10);
    const peStr = pe.toISOString().substring(0, 10);
    const period = psStr.substring(0, 7);

    // Get users who emitted documents in this period
    let usersQ = supabase.from('faturas').select('user_id').eq('incluir_saft', true)
      .gte('data_emissao', psStr).lte('data_emissao', peStr);
    if (targetUserIds) usersQ = usersQ.in('user_id', targetUserIds);
    const { data: userRows } = await usersQ;
    const userIds = Array.from(new Set((userRows || []).map((r: any) => r.user_id)));

    const results: any[] = [];
    for (const uid of userIds) {
      // Skip if already sent
      const { data: existing } = await supabase.from('saft_submissions')
        .select('id, status').eq('user_id', uid).eq('period', period).maybeSingle();
      if (existing?.status === 'sent') {
        results.push({ user: uid, skipped: true }); continue;
      }

      const xml = await buildSaftXml(supabase, uid, psStr, peStr);
      const hash = await sha256(xml);
      const path = `${uid}/${period}.xml`;

      await supabase.storage.from('saft').upload(path, new Blob([xml], { type: 'application/xml' }), { upsert: true });

      const subRes = await submitToAgt(xml, hash);
      const submissionRow = {
        user_id: uid, period, xml_path: path, xml_hash: hash,
        status: subRes.ok ? 'sent' : (subRes.dryRun ? 'pending' : 'error'),
        agt_reference: subRes.ok ? subRes.reference : null,
        error_message: subRes.ok ? null : subRes.message,
        submitted_at: subRes.ok ? new Date().toISOString() : null,
        attempts: (existing as any)?.attempts ? (existing as any).attempts + 1 : 1,
        last_attempt_at: new Date().toISOString(),
      };
      if (existing) {
        await supabase.from('saft_submissions').update(submissionRow).eq('id', existing.id);
      } else {
        await supabase.from('saft_submissions').insert(submissionRow);
      }

      await supabase.from('notifications').insert({
        user_id: uid,
        type: subRes.ok ? 'success' : 'warning',
        title: subRes.ok ? `SAF-T ${period} enviado ✅` : `SAF-T ${period} pendente`,
        message: subRes.ok
          ? `Submissão à AGT concluída. Ref: ${subRes.reference}`
          : (subRes.message || 'Falha na submissão à AGT.'),
      });

      results.push({ user: uid, period, ...subRes });
    }

    return new Response(JSON.stringify({ ok: true, period, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
