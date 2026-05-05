/**
 * AGT Document Hash (HashControl)
 * Implementa o algoritmo de encadeamento de chaves conforme
 * Decreto Presidencial 312/18 e requisitos AGT Angola.
 *
 * Cada documento tem uma chave gerada a partir de:
 *   Data emissão ; Data sistema ; Número documento ; Total bruto ; Hash anterior
 *
 * A chave é assinada com RSA-SHA1 (256-bit) e os primeiros 4 caracteres
 * do hash Base64 aparecem no PDF como extracto da chave.
 *
 * NOTA: Em produção, a chave privada RSA deve estar em ambiente seguro
 * (variável de ambiente / secrets manager). Aqui usamos SHA-256 como
 * substituto seguro para desenvolvimento até obter o certificado AGT.
 */

export interface HashInput {
  dataEmissao: string;        // YYYY-MM-DD
  dataHoraSistema: string;    // YYYY-MM-DDTHH:MM:SS
  numeroDocumento: string;    // ex: FT 2024/1
  totalBruto: number;         // Gross Total com 2 casas decimais
  hashAnterior: string;       // Hash do documento anterior (ou "0" para o primeiro)
}

export interface HashResult {
  hashCompleto: string;       // Hash Base64 completo (para SAF-T HashControl)
  extracto4Chars: string;     // Primeiros 4 chars (para imprimir no PDF)
  stringAssinada: string;     // String que foi assinada (para auditoria)
}

/**
 * Formata o total bruto com 2 casas decimais sem separador de milhar
 * conforme especificação AGT (ex: 12345.67)
 */
function formatTotal(valor: number): string {
  return valor.toFixed(2);
}

/**
 * Constrói a string a assinar conforme estrutura AGT:
 * "dataEmissao;dataHoraSistema;numeroDocumento;totalBruto;hashAnterior"
 */
function buildSignatureString(input: HashInput): string {
  return [
    input.dataEmissao,
    input.dataHoraSistema,
    input.numeroDocumento,
    formatTotal(input.totalBruto),
    input.hashAnterior,
  ].join(';');
}

/**
 * Gera hash SHA-256 em ambiente browser/Node (Web Crypto API)
 * Retorna Base64 standard.
 *
 * Em produção: substituir por assinatura RSA-SHA1 com chave privada certificada AGT.
 */
async function sha256Base64(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBinary = hashArray.map(b => String.fromCharCode(b)).join('');
  return btoa(hashBinary);
}

/**
 * Gera o hash AGT para um documento.
 * Uso: await generateAGTHash(input)
 */
export async function generateAGTHash(input: HashInput): Promise<HashResult> {
  const stringAssinada = buildSignatureString(input);
  const hashCompleto = await sha256Base64(stringAssinada);
  const extracto4Chars = hashCompleto.slice(0, 4);

  return {
    hashCompleto,
    extracto4Chars,
    stringAssinada,
  };
}

/**
 * Gera o hash para o primeiro documento da série (hashAnterior = "0")
 */
export async function generateFirstHash(
  dataEmissao: string,
  dataHoraSistema: string,
  numeroDocumento: string,
  totalBruto: number,
): Promise<HashResult> {
  return generateAGTHash({
    dataEmissao,
    dataHoraSistema,
    numeroDocumento,
    totalBruto,
    hashAnterior: '0',
  });
}

/**
 * Valida se um hash tem o formato correcto (Base64, mínimo 4 chars)
 */
export function isValidHash(hash: string): boolean {
  if (!hash || hash.length < 4) return false;
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(hash);
}

/**
 * Mensagem obrigatória AGT a imprimir no rodapé de cada documento.
 * O número n31.1 é o número de validação do programa — substituir pelo real.
 */
export function getAGTValidationMessage(extracto4Chars: string): string {
  return `${extracto4Chars}-Processado por programa válido n31.1/AGT20`;
}

/**
 * Formata a data/hora do sistema no formato AGT: YYYY-MM-DDTHH:MM:SS
 */
export function getSystemDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Tabela de códigos de motivo de isenção de IVA (TaxExemptionReason)
 * conforme tabela AGT / CIVA Angola
 */
export const IVA_EXEMPTION_CODES: { code: string; description: string }[] = [
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

/**
 * Taxas de IVA válidas em Angola
 */
export const IVA_RATES = [
  { value: 0, label: 'Isento (0%)' },
  { value: 5, label: '5%' },
  { value: 14, label: '14% (taxa normal)' },
];

/**
 * Tipos de documento AGT completos conforme DP 312/18
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
  | 'fatura-generica'
  | 'auto-faturacao'
  | 'consulta';

export const TIPOS_DOCUMENTO_AGT: {
  value: TipoDocumentoAGT;
  label: string;
  labelCurto: string;
  codigoSAFT: string;
  descricao: string;
  requerDocOrigem: boolean;
  incluiNoSAFT: boolean;
}[] = [
  {
    value: 'fatura',
    label: 'Fatura',
    labelCurto: 'FT',
    codigoSAFT: 'FT',
    descricao: 'Fatura simples para cliente com NIF',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'fatura-recibo',
    label: 'Fatura-Recibo',
    labelCurto: 'FR',
    codigoSAFT: 'FR',
    descricao: 'Fatura com recibo incorporado (pagamento imediato)',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'recibo',
    label: 'Recibo',
    labelCurto: 'RC',
    codigoSAFT: 'RC',
    descricao: 'Recibo de pagamento de fatura anterior',
    requerDocOrigem: true,
    incluiNoSAFT: true,
  },
  {
    value: 'nota-credito',
    label: 'Nota de Crédito',
    labelCurto: 'NC',
    codigoSAFT: 'NC',
    descricao: 'Nota de crédito sobre fatura anterior (deve gerar OrderReference)',
    requerDocOrigem: true,
    incluiNoSAFT: true,
  },
  {
    value: 'nota-debito',
    label: 'Nota de Débito',
    labelCurto: 'ND',
    codigoSAFT: 'ND',
    descricao: 'Nota de débito sobre fatura anterior',
    requerDocOrigem: true,
    incluiNoSAFT: true,
  },
  {
    value: 'proforma',
    label: 'Fatura Pró-Forma',
    labelCurto: 'PF',
    codigoSAFT: 'PF',
    descricao: 'Documento para conferência — não tem efeito fiscal directo (gera OrderReferences na fatura)',
    requerDocOrigem: false,
    incluiNoSAFT: false,
  },
  {
    value: 'orcamento',
    label: 'Orçamento',
    labelCurto: 'OR',
    codigoSAFT: 'OR',
    descricao: 'Orçamento comercial — não tem efeito fiscal',
    requerDocOrigem: false,
    incluiNoSAFT: false,
  },
  {
    value: 'guia-remessa',
    label: 'Guia de Remessa',
    labelCurto: 'GR',
    codigoSAFT: 'GR',
    descricao: 'Documento de transporte de mercadorias',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'fatura-global',
    label: 'Fatura Global',
    labelCurto: 'FG',
    codigoSAFT: 'FG',
    descricao: 'Fatura agregada de múltiplas operações (consumidor final)',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'fatura-generica',
    label: 'Fatura Genérica',
    labelCurto: 'FGe',
    codigoSAFT: 'FGe',
    descricao: 'Fatura genérica — se aplicável à actividade',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'auto-faturacao',
    label: 'Auto-Faturação',
    labelCurto: 'AF',
    codigoSAFT: 'AF',
    descricao: 'Fatura emitida pelo comprador em nome do fornecedor',
    requerDocOrigem: false,
    incluiNoSAFT: true,
  },
  {
    value: 'consulta',
    label: 'Consulta / Rascunho',
    labelCurto: 'CS',
    codigoSAFT: 'CS',
    descricao: 'Documento interno — não tem efeito fiscal',
    requerDocOrigem: false,
    incluiNoSAFT: false,
  },
];

/**
 * Moedas suportadas para documentos em moeda estrangeira
 */
export const MOEDAS = [
  { code: 'AOA', symbol: 'Kz', label: 'Kwanza Angolano' },
  { code: 'USD', symbol: '$', label: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'Libra Esterlina' },
  { code: 'ZAR', symbol: 'R', label: 'Rand Sul-Africano' },
  { code: 'CNY', symbol: '¥', label: 'Yuan Chinês' },
];