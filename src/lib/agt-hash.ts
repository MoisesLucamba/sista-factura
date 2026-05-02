/**
 * AGT Hash Chain — Decreto Presidencial 312/18
 * Generates SHA-256 hash for invoice document chain (HashControl)
 * Format: dataEmissao;dataHoraSistema;numeroDocumento;totalBruto;hashAnterior
 */

export interface AGTHashInput {
  dataEmissao: string;       // YYYY-MM-DD
  dataHoraSistema: string;   // ISO timestamp
  numeroDocumento: string;   // ex: FT A/2024/000001
  totalBruto: number;        // GrossTotal (com IVA)
  hashAnterior: string | null;
}

export interface AGTHashResult {
  hashCompleto: string;       // Base64 SHA-256
  extracto4Chars: string;     // First 4 chars of Base64 hash
  inputString: string;        // The string used (for debugging)
}

/**
 * Generates the AGT-compliant document hash for the chain.
 * Returns hash in Base64 (per AGT spec) plus the 4-char extract for printing.
 */
export async function generateAGTHash(input: AGTHashInput): Promise<AGTHashResult> {
  const inputString = [
    input.dataEmissao,
    input.dataHoraSistema,
    input.numeroDocumento,
    Number(input.totalBruto || 0).toFixed(2),
    input.hashAnterior || '0',
  ].join(';');

  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);

  // Base64 encode
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const hashCompleto = btoa(binary);
  const extracto4Chars = hashCompleto.substring(0, 4);

  return { hashCompleto, extracto4Chars, inputString };
}

/**
 * AGT Software certification footer line (REGRA 1, 14)
 * Format: XXXX-Processado por programa válido n31.1/AGT20
 */
export function getAgtSoftwareLine(extracto4Chars: string): string {
  return `${extracto4Chars}-Processado por programa válido nº31.1/AGT20`;
}
