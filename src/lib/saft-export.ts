/**
 * SAF-T (AO) XML Exporter — Decreto Presidencial 312/18
 * Generates the AuditFile XML compatible with AGT specification AO_1.00_01
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AGT_SOFTWARE_CERT_NUMBER,
  AGT_PRODUCT_COMPANY_TAX_ID,
  AGT_PRODUCT_ID,
  AGT_PRODUCT_VERSION,
  DOCUMENT_TYPES,
  getTaxCode,
  type TipoDocumentoAGT,
} from './agt-constants';

function esc(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function num(n: number | null | undefined, decimals = 2): string {
  return Number(n || 0).toFixed(decimals);
}

export interface SaftExportOptions {
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  fiscalYear?: number;
}

export async function exportSAFT(opts: SaftExportOptions): Promise<string> {
  const { userId, startDate, endDate } = opts;
  const fiscalYear = opts.fiscalYear || new Date(startDate).getFullYear();

  // 1) Empresa (agt_config)
  const { data: agt } = await supabase
    .from('agt_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // 2) Faturas no período (excluir proforma/orcamento — incluir_saft=false)
  const { data: faturas } = await supabase
    .from('faturas')
    .select('*, cliente:clientes(*)')
    .eq('user_id', userId)
    .gte('data_emissao', startDate)
    .lte('data_emissao', endDate)
    .order('created_at', { ascending: true });

  const faturasFiscais = (faturas || []).filter((f: any) => f.incluir_saft !== false);

  // 3) Itens
  const faturaIds = faturasFiscais.map((f: any) => f.id);
  let allItens: any[] = [];
  if (faturaIds.length > 0) {
    const { data: itensData } = await supabase
      .from('itens_fatura')
      .select('*, produto:produtos(*)')
      .in('fatura_id', faturaIds);
    allItens = itensData || [];
  }

  // 4) Master data — clientes
  const clientesMap = new Map<string, any>();
  for (const f of faturasFiscais) {
    if (f.cliente && !clientesMap.has(f.cliente.id)) clientesMap.set(f.cliente.id, f.cliente);
  }

  // 5) Master data — produtos
  const produtosMap = new Map<string, any>();
  for (const it of allItens) {
    if (it.produto && !produtosMap.has(it.produto.id)) produtosMap.set(it.produto.id, it.produto);
  }

  // ─── Build Header ──────────────────────────────────────────
  const compName = esc(agt?.nome_empresa || 'Empresa');
  const compNif = esc(agt?.nif_produtor || '');
  const compAddr = esc(agt?.morada || agt?.endereco_empresa || '');
  const compCity = esc(agt?.cidade || '');
  const compProv = esc(agt?.provincia || '');
  const dateCreated = new Date().toISOString().split('T')[0];

  const header = `  <Header>
    <AuditFileVersion>1.00_01</AuditFileVersion>
    <CompanyID>${compNif}</CompanyID>
    <TaxRegistrationNumber>${compNif}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${compName}</CompanyName>
    <BusinessName>${compName}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${compAddr}</AddressDetail>
      <City>${compCity}</City>
      <Region>${compProv}</Region>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${fiscalYear}</FiscalYear>
    <StartDate>${startDate}</StartDate>
    <EndDate>${endDate}</EndDate>
    <CurrencyCode>AOA</CurrencyCode>
    <DateCreated>${dateCreated}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>${AGT_PRODUCT_COMPANY_TAX_ID}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>${AGT_SOFTWARE_CERT_NUMBER}</SoftwareCertificateNumber>
    <ProductID>${AGT_PRODUCT_ID}</ProductID>
    <ProductVersion>${AGT_PRODUCT_VERSION}</ProductVersion>
  </Header>`;

  // ─── Master Files ──────────────────────────────────────────
  const customers = Array.from(clientesMap.values()).map((c: any) => `      <Customer>
        <CustomerID>${esc(c.id)}</CustomerID>
        <AccountID>Desconhecido</AccountID>
        <CustomerTaxID>${esc(c.nif || '999999999')}</CustomerTaxID>
        <CompanyName>${esc(c.nome)}</CompanyName>
        <BillingAddress>
          <AddressDetail>${esc(c.endereco || 'N/A')}</AddressDetail>
          <City>Luanda</City>
          <Country>AO</Country>
        </BillingAddress>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </Customer>`).join('\n');

  const products = Array.from(produtosMap.values()).map((p: any) => `      <Product>
        <ProductType>${p.tipo === 'servico' ? 'S' : 'P'}</ProductType>
        <ProductCode>${esc(p.codigo)}</ProductCode>
        <ProductDescription>${esc(p.nome)}</ProductDescription>
        <ProductNumberCode>${esc(p.barcode || p.codigo)}</ProductNumberCode>
      </Product>`).join('\n');

  // Tax table — gather distinct rates used
  const distinctRates = new Set<number>();
  for (const it of allItens) distinctRates.add(Number(it.taxa_iva || 0));
  const taxTable = Array.from(distinctRates).map(rate => `      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>${getTaxCode(rate)}</TaxCode>
        <Description>IVA ${rate}%</Description>
        <TaxPercentage>${rate}</TaxPercentage>
      </TaxTableEntry>`).join('\n');

  const masterFiles = `  <MasterFiles>
    <Customer>
${customers || '      <!-- Sem clientes -->'}
    </Customer>
    <Product>
${products || '      <!-- Sem produtos -->'}
    </Product>
    <TaxTable>
${taxTable || '      <!-- Sem taxas -->'}
    </TaxTable>
  </MasterFiles>`;

  // ─── Source Documents — SalesInvoices ──────────────────────
  const numEntries = faturasFiscais.length;
  let totalCredit = 0;
  let totalDebit = 0;

  const invoiceXml = faturasFiscais.map((f: any) => {
    const docType = DOCUMENT_TYPES[f.tipo as TipoDocumentoAGT];
    const saftType = docType?.saft || 'FT';
    const status = f.estado === 'anulada' ? 'A' : 'N';
    const sourceBilling = 'P'; // Production

    const itensF = allItens.filter(it => it.fatura_id === f.id);
    const linesXml = itensF.map((it: any, idx: number) => {
      const desc = it.desconto ? Number(it.desconto) : 0;
      const unitPriceNet = Number(it.preco_unitario || 0) * (1 - desc / 100);
      const taxRate = Number(it.taxa_iva || 0);
      const exemptionXml = (taxRate === 0 && it.tax_exemption_code)
        ? `\n          <TaxExemptionReason>${esc(it.tax_exemption_reason || '')}</TaxExemptionReason>\n          <TaxExemptionCode>${esc(it.tax_exemption_code)}</TaxExemptionCode>`
        : '';

      return `        <Line>
          <LineNumber>${idx + 1}</LineNumber>
          <ProductCode>${esc(it.produto?.codigo || it.produto_id)}</ProductCode>
          <ProductDescription>${esc(it.produto?.nome || 'Produto')}</ProductDescription>
          <Quantity>${num(it.quantidade, 4)}</Quantity>
          <UnitOfMeasure>${esc(it.produto?.unidade || 'UN')}</UnitOfMeasure>
          <UnitPrice>${unitPriceNet.toFixed(4)}</UnitPrice>
          <TaxPointDate>${f.data_emissao}</TaxPointDate>
          <Description>${esc(it.produto?.nome || 'Produto')}</Description>
          <CreditAmount>${num(it.subtotal)}</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>AO</TaxCountryRegion>
            <TaxCode>${getTaxCode(taxRate)}</TaxCode>
            <TaxPercentage>${taxRate}</TaxPercentage>
          </Tax>${exemptionXml}
        </Line>`;
    }).join('\n');

    totalCredit += Number(f.total || 0);

    const orderRefXml = f.order_reference_numero
      ? `\n        <OrderReferences><OriginatingON>${esc(f.order_reference_numero)}</OriginatingON><OrderDate>${f.data_emissao}</OrderDate></OrderReferences>`
      : '';

    const settlementXml = (Number(f.desconto_global_valor || 0) > 0)
      ? `\n          <Settlement><SettlementAmount>${num(f.desconto_global_valor)}</SettlementAmount></Settlement>`
      : '';

    const moeda = f.moeda || 'AOA';
    const currencyXml = moeda !== 'AOA'
      ? `\n          <Currency><CurrencyCode>${esc(moeda)}</CurrencyCode><CurrencyAmount>${num(f.total)}</CurrencyAmount><ExchangeRate>${num(f.taxa_cambio, 6)}</ExchangeRate></Currency>`
      : '';

    const period = f.periodo_contabilistico || (f.data_emissao || '').substring(5, 7);
    const sysEntry = f.system_entry_date
      ? new Date(f.system_entry_date).toISOString().substring(0, 19)
      : `${f.data_emissao}T00:00:00`;

    return `      <Invoice>
        <InvoiceNo>${esc(f.numero)}</InvoiceNo>
        <ATCUD>0</ATCUD>
        <DocumentStatus>
          <InvoiceStatus>${status}</InvoiceStatus>
          <InvoiceStatusDate>${sysEntry}</InvoiceStatusDate>
          <SourceID>${esc(f.user_id)}</SourceID>
          <SourceBilling>${sourceBilling}</SourceBilling>
        </DocumentStatus>
        <Hash>${esc(f.hash_doc || '0')}</Hash>
        <HashControl>${esc(f.hash_extracto || '0')}</HashControl>
        <Period>${esc(period.split('-').pop() || period)}</Period>
        <InvoiceDate>${f.data_emissao}</InvoiceDate>
        <InvoiceType>${saftType}</InvoiceType>
        <SpecialRegimes><SelfBillingIndicator>${f.tipo === 'auto-faturacao' ? '1' : '0'}</SelfBillingIndicator></SpecialRegimes>
        <SystemEntryDate>${sysEntry}</SystemEntryDate>
        <CustomerID>${esc(f.cliente_id)}</CustomerID>${orderRefXml}
${linesXml}
        <DocumentTotals>
          <TaxPayable>${num(f.total_iva)}</TaxPayable>
          <NetTotal>${num(f.subtotal)}</NetTotal>
          <GrossTotal>${num(f.total)}</GrossTotal>${settlementXml}${currencyXml}
        </DocumentTotals>
      </Invoice>`;
  }).join('\n');

  const sourceDocuments = `  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${numEntries}</NumberOfEntries>
      <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>
      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>
${invoiceXml}
    </SalesInvoices>
  </SourceDocuments>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.00_01">
${header}
${masterFiles}
${sourceDocuments}
</AuditFile>
`;

  return xml;
}

export function downloadSaft(xml: string, nif: string, year: number, month: number) {
  const filename = `SAFT-AO-${nif || '000000000'}-${year}${String(month).padStart(2, '0')}.xml`;
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
