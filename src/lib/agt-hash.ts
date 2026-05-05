/**
 * AGT Hash Chain — Decreto Presidencial 312/18
 * Implementação robusta para geração de HashControl de documentos fiscais em Angola
 */

export interface AGTHashInput {
  dataEmissao: string;       // YYYY-MM-DD
  dataHoraSistema: string;   // YYYY-MM-DDTHH:MM:SS
  numeroDocumento: string;   // ex: FT A/2024/000001
  totalBruto: number;        // Gross Total (com 2 casas decimais)
  hashAnterior?: string;     // Hash anterior ou undefined/null
}

export interface AGTHashResult {
  hashCompleto: string;       // Base64 SHA-256
  extracto4Chars: string;     // Primeiros 4 chars
  stringAssinada: string;     // String usada (auditoria)
}

/**
 * Formata valores monetários conforme AGT (2 casas decimais, sem separador de milhar)
 */
function formatTotal(valor: number): string {
  return Number(valor || 0).toFixed(2);
}

/**
 * Constrói a string padrão AGT
 */
function buildSignatureString(input: AGTHashInput): string {
  return [
    input.dataEmissao,
    input.dataHoraSistema,
    input.numeroDocumento,
    formatTotal(input.totalBruto),
    input.hashAnterior || '0',
  ].join(';');
}

/**
 * Gera SHA-256 Base64 (compatível browser + Node)
 */
async function sha256Base64(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const cryptoObj = globalThis.crypto || (window as any).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Crypto API não disponível no ambiente');
  }

  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * Gera hash AGT
 */
export async function generateAGTHash(input: AGTHashInput): Promise<AGTHashResult> {
  const stringAssinada = buildSignatureString(input);
  const hashCompleto = await sha256Base64(stringAssinada);
  const extracto4Chars = hashCompleto.substring(0, 4);

  return {
    hashCompleto,
    extracto4Chars,
    stringAssinada,
  };
}

/**
 * Primeiro documento da série
 */
export async function generateFirstHash(
  dataEmissao: string,
  dataHoraSistema: string,
  numeroDocumento: string,
  totalBruto: number
): Promise<AGTHashResult> {
  return generateAGTHash({
    dataEmissao,
    dataHoraSistema,
    numeroDocumento,
    totalBruto,
    hashAnterior: '0',
  });
}

/**
 * Validação básica de hash Base64
 */
export function isValidHash(hash: string): boolean {
  if (!hash || hash.length < 4) return false;
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(hash);
}

/**
 * Linha obrigatória AGT
 */
export function getAGTValidationMessage(extracto4Chars: string): string {
  return `${extracto4Chars}-Processado por programa válido nº31.1/AGT20`;
}

/**
 * Data/hora no formato AGT
 */
export function getSystemDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Códigos de isenção IVA
 */
export const IVA_EXEMPTION_CODES = [
  { code: 'M00', description: 'Regime Transitório' },
  { code: 'M02', description: 'Não sujeita' },
  { code: 'M04', description: 'Regime de não sujeição' },
  { code: 'M11', description: 'Isento Art. 12.º b)' },
  { code: 'M12', description: 'Isento Art. 12.º c)' },
  { code: 'M13', description: 'Isento Art. 12.º d)' },
  { code: 'M14', description: 'Isento Art. 12.º e)' },
  { code: 'M15', description: 'Isento Art. 12.º f)' },
  { code: 'M17', description: 'Isento Art. 12.º h)' },
  { code: 'M18', description: 'Isento Art. 12.º i)' },
  { code: 'M19', description: 'Isento Art. 12.º j)' },
  { code: 'M20', description: 'Isento Art. 12.º k)' },
];

/**
 * Taxas IVA Angola
 */
export const IVA_RATES = [
  { value: 0, label: 'Isento (0%)' },
  { value: 5, label: '5%' },
  { value: 14, label: '14% (normal)' },
];

/**
 * Tipos de documento
 */
export type TipoDocumentoAGT =
  | 'fatura'
  | 'fatura-recibo'
  | 'recibo'
  | 'nota-credito'
  | 'nota-debito'
  | 'proforma'
  | 'orcamento'
  | 'guia-remessa'
  | 'fatura-global'
  | 'auto-faturacao'
  | 'consulta';

export const TIPOS_DOCUMENTO_AGT = [
  { value: 'fatura', label: 'Fatura', code: 'FT' },
  { value: 'fatura-recibo', label: 'Fatura-Recibo', code: 'FR' },
  { value: 'recibo', label: 'Recibo', code: 'RC' },
  { value: 'nota-credito', label: 'Nota de Crédito', code: 'NC' },
  { value: 'nota-debito', label: 'Nota de Débito', code: 'ND' },
  { value: 'proforma', label: 'Proforma', code: 'PF' },
  { value: 'orcamento', label: 'Orçamento', code: 'OR' },
  { value: 'guia-remessa', label: 'Guia de Remessa', code: 'GR' },
  { value: 'fatura-global', label: 'Fatura Global', code: 'FG' },
  { value: 'auto-faturacao', label: 'Auto-Faturação', code: 'AF' },
  { value: 'consulta', label: 'Consulta', code: 'CS' },
];

/**
 * Moedas
 */
export const MOEDAS = [
  { code: 'AOA', symbol: 'Kz', label: 'Kwanza' },
  { code: 'USD', symbol: '$', label: 'Dólar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
];