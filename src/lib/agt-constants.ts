/**
 * AGT Constants — Decreto Presidencial 312/18
 * Document types, exemption codes, currencies
 */

// REGRA 2 — Document types with SAF-T codes
export const DOCUMENT_TYPES = {
  fatura:           { saft: 'FT',  label: 'Fatura',                fiscal: true,  group: 'fiscal'  as const, requireOrigin: false },
  'fatura-recibo':  { saft: 'FR',  label: 'Fatura-Recibo',         fiscal: true,  group: 'fiscal'  as const, requireOrigin: false },
  recibo:           { saft: 'RC',  label: 'Recibo',                fiscal: true,  group: 'fiscal'  as const, requireOrigin: true  },
  'nota-credito':   { saft: 'NC',  label: 'Nota de Crédito',       fiscal: true,  group: 'fiscal'  as const, requireOrigin: true  },
  'nota-debito':    { saft: 'ND',  label: 'Nota de Débito',        fiscal: true,  group: 'fiscal'  as const, requireOrigin: true  },
  'fatura-global':  { saft: 'FG',  label: 'Fatura Global',         fiscal: true,  group: 'fiscal'  as const, requireOrigin: false },
  'fatura-generica':{ saft: 'FGe', label: 'Fatura Genérica',       fiscal: true,  group: 'fiscal'  as const, requireOrigin: false },
  'auto-faturacao': { saft: 'AF',  label: 'Auto-Faturação',        fiscal: true,  group: 'fiscal'  as const, requireOrigin: false },
  proforma:         { saft: 'PF',  label: 'Fatura Pró-Forma',      fiscal: false, group: 'comercial' as const, requireOrigin: false },
  orcamento:        { saft: 'OR',  label: 'Orçamento',             fiscal: false, group: 'comercial' as const, requireOrigin: false },
  'guia-remessa':   { saft: 'GR',  label: 'Guia de Remessa',       fiscal: true,  group: 'comercial' as const, requireOrigin: false },
} as const;

export type TipoDocumentoAGT = keyof typeof DOCUMENT_TYPES;

// REGRA 3 — IVA Exemption codes (CIVA Angola)
export interface ExemptionCode {
  code: string;
  description: string;
}

export const TAX_EXEMPTION_CODES: ExemptionCode[] = [
  { code: 'M00', description: 'Regime Transitório' },
  { code: 'M02', description: 'Transmissão de bens e serviço não sujeita' },
  { code: 'M04', description: 'IVA - Regime de não Sujeição' },
  { code: 'M11', description: 'Isento Artigo 12.º b) do CIVA' },
  { code: 'M12', description: 'Isento Artigo 12.º c) do CIVA' },
  { code: 'M13', description: 'Isento Artigo 12.º d) do CIVA' },
  { code: 'M14', description: 'Isento Artigo 12.º e) do CIVA' },
  { code: 'M15', description: 'Isento Artigo 12.º f) do CIVA' },
  { code: 'M17', description: 'Isento Artigo 12.º h) do CIVA' },
  { code: 'M18', description: 'Isento Artigo 12.º i) do CIVA' },
  { code: 'M19', description: 'Isento Artigo 12.º j) do CIVA' },
  { code: 'M20', description: 'Isento Artigo 12.º k) do CIVA' },
  { code: 'M30', description: 'Isento Artigo 15.º 1 a) do CIVA' },
  { code: 'M31', description: 'Isento Artigo 15.º 1 b) do CIVA' },
  { code: 'M32', description: 'Isento Artigo 15.º 1 c) do CIVA' },
  { code: 'M33', description: 'Isento Artigo 15.º 1 d) do CIVA' },
  { code: 'M34', description: 'Isento Artigo 15.º 1 e) do CIVA' },
  { code: 'M35', description: 'Isento Artigo 15.º 1 f) do CIVA' },
  { code: 'M36', description: 'Isento Artigo 15.º 1 g) do CIVA' },
  { code: 'M37', description: 'Isento Artigo 15.º 1 h) do CIVA' },
  { code: 'M38', description: 'Isento Artigo 15.º 1 i) do CIVA' },
];

// REGRA 6 — Supported currencies
export const CURRENCIES = [
  { code: 'AOA', symbol: 'Kz', name: 'Kwanza Angolano' },
  { code: 'USD', symbol: '$',  name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'Libra Esterlina' },
  { code: 'ZAR', symbol: 'R',  name: 'Rand Sul-Africano' },
  { code: 'CNY', symbol: '¥',  name: 'Yuan Chinês' },
];

// Valid IVA rates in Angola
export const VALID_IVA_RATES = [0, 5, 14] as const;

// Tax codes for SAF-T
export function getTaxCode(rate: number): 'NOR' | 'ISE' | 'RED' {
  if (rate === 14) return 'NOR';
  if (rate === 0) return 'ISE';
  return 'RED'; // 5%
}

// REGRA 1 — AGT software certification number
export const AGT_SOFTWARE_CERT_NUMBER = '31';
export const AGT_SOFTWARE_CERT_VERSION = '31.1/AGT20';
export const AGT_PRODUCT_COMPANY_TAX_ID = '5002964031';
export const AGT_PRODUCT_ID = 'Faktura Angola';
export const AGT_PRODUCT_VERSION = '1.0';

// Period contabilístico: YYYY-MM
export function getPeriodoContabilistico(date: string): string {
  return date.substring(0, 7); // YYYY-MM
}
