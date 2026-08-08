/**
 * Parser + validador de ficheiros SAF-T (AO) para originação de crédito.
 * Não emite documentos — apenas lê o que a empresa já produz no seu software certificado.
 */

export interface SaftMonth {
  mes: string;        // YYYY-MM
  total: number;      // valor bruto vendido
  documentos: number;
}

/** Produto agregado a partir das linhas dos documentos do SAF-T. */
export interface SaftProduto {
  codigo: string;
  descricao: string;
  quantidade: number;
  total: number;
  /** quantidade movimentada por mês (YYYY-MM) */
  porMes: Record<string, number>;
}

export interface SaftParsed {
  nif: string;
  empresaNome: string;
  software: string;
  softwareCertNumber: string;
  softwareValidationNumber: string;
  periodoInicio: string | null;
  periodoFim: string | null;
  periodoLabel: string;
  totalVendas: number;
  numDocumentos: number;
  vendasPorMes: SaftMonth[];
  produtos: SaftProduto[];
  hashesAmostra: string[];
  hashControl: string;
}


export interface SaftValidation {
  formatoOk: boolean;
  certificadoOk: boolean;
  hashControlOk: boolean;
  nifOk: boolean;
  valido: boolean;
  mensagem: string;
  detalhes: Record<string, string>;
}

const text = (el: Element | null | undefined, tag: string): string => {
  if (!el) return '';
  const node = el.getElementsByTagName(tag)[0];
  return node?.textContent?.trim() ?? '';
};

const num = (v: string): number => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function parseSaft(xml: string): SaftParsed {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('O ficheiro não é um XML válido.');
  }

  const header = doc.getElementsByTagName('Header')[0];
  if (!header) throw new Error('Ficheiro sem cabeçalho SAF-T. Confirma que exportaste o SAF-T (AO).');

  const company = doc.getElementsByTagName('Company')[0] ?? header;

  const nif = text(header, 'TaxRegistrationNumber') || text(company, 'TaxRegistrationNumber');
  const empresaNome = text(header, 'CompanyName') || text(company, 'CompanyName');
  const software = [text(header, 'ProductCompanyTaxID'), text(header, 'ProductID'), text(header, 'ProductVersion')]
    .filter(Boolean).join(' · ');
  const softwareCertNumber = text(header, 'SoftwareCertificateNumber');
  const softwareValidationNumber = text(header, 'SoftwareValidationNumber');
  const periodoInicio = text(header, 'StartDate') || null;
  const periodoFim = text(header, 'EndDate') || null;

  const salesRoot = doc.getElementsByTagName('SalesInvoices')[0];
  const invoices = salesRoot ? Array.from(salesRoot.getElementsByTagName('Invoice')) : [];

  const byMonth = new Map<string, SaftMonth>();
  const hashesAmostra: string[] = [];
  let totalVendas = 0;

  for (const inv of invoices) {
    const date = text(inv, 'InvoiceDate');
    const totals = inv.getElementsByTagName('DocumentTotals')[0];
    const gross = num(text(totals ?? inv, 'GrossTotal'));
    const hash = text(inv, 'Hash');
    if (hash && hashesAmostra.length < 5) hashesAmostra.push(hash);

    const status = text(inv, 'InvoiceStatus');
    if (status === 'A' || status === 'F') continue; // anulada / faturada em outro doc

    totalVendas += gross;
    const mes = date ? date.slice(0, 7) : 'sem-data';
    const cur = byMonth.get(mes) ?? { mes, total: 0, documentos: 0 };
    cur.total += gross;
    cur.documentos += 1;
    byMonth.set(mes, cur);
  }

  const vendasPorMes = Array.from(byMonth.values())
    .filter(m => m.mes !== 'sem-data')
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const periodoLabel = periodoInicio && periodoFim
    ? `${periodoInicio} → ${periodoFim}`
    : (vendasPorMes[0]?.mes ?? 'período desconhecido');

  return {
    nif,
    empresaNome,
    software,
    softwareCertNumber,
    softwareValidationNumber,
    periodoInicio,
    periodoFim,
    periodoLabel,
    totalVendas: Math.round(totalVendas * 100) / 100,
    numDocumentos: invoices.length,
    vendasPorMes,
    hashesAmostra,
    hashControl: text(salesRoot ?? header, 'HashControl') || hashesAmostra[0] || '',
  };
}

/** Nº de certificado AGT válido: formato "nNNN.N/AGTYY" ou "NNN/AGTYY". */
const CERT_RE = /^n?\s*\d+(\.\d+)?\s*\/\s*AGT\s*\d{2}$/i;

export function validateSaft(parsed: SaftParsed, nifEsperado?: string): SaftValidation {
  const formatoOk = Boolean(parsed.nif && parsed.periodoInicio && parsed.numDocumentos >= 0);
  const certificadoOk = CERT_RE.test(parsed.softwareCertNumber.trim());
  const hashControlOk = Boolean(parsed.hashControl) && parsed.hashesAmostra.length > 0;
  const nifOk = nifEsperado ? parsed.nif.replace(/\D/g, '') === nifEsperado.replace(/\D/g, '') : Boolean(parsed.nif);

  const falhas: string[] = [];
  if (!formatoOk) falhas.push('estrutura do ficheiro incompleta');
  if (!certificadoOk) falhas.push('nº de certificado AGT ausente ou em formato inválido');
  if (!hashControlOk) falhas.push('assinatura/HashControl dos documentos em falta');
  if (!nifOk) falhas.push('NIF do ficheiro não corresponde ao NIF da empresa');

  return {
    formatoOk,
    certificadoOk,
    hashControlOk,
    nifOk,
    valido: formatoOk && certificadoOk && hashControlOk && nifOk,
    mensagem: falhas.length === 0
      ? 'Ficheiro válido e aceite para análise de crédito.'
      : `Ficheiro rejeitado: ${falhas.join('; ')}.`,
    detalhes: {
      nif: parsed.nif,
      empresa: parsed.empresaNome,
      software: parsed.software,
      certificado: parsed.softwareCertNumber,
      validacao: parsed.softwareValidationNumber,
      periodo: parsed.periodoLabel,
      documentos: String(parsed.numDocumentos),
    },
  };
}
