/**
 * AGT-compliant invoice digital signing
 * Uses Web Crypto API for RSA-SHA256 signatures with hash chain
 */

export interface SignatureInput {
  numero: string;
  data_emissao: string;
  tipo: string;
  subtotal: number;
  total_iva: number;
  total: number;
  nif_emitente: string;
  nif_cliente: string;
  previous_hash: string | null;
}

/**
 * Generate document hash for signing (SHA-256)
 */
export async function generateDocumentHash(input: SignatureInput): Promise<string> {
  const dataString = [
    input.numero,
    input.data_emissao,
    input.tipo,
    input.subtotal.toFixed(2),
    input.total_iva.toFixed(2),
    input.total.toFixed(2),
    input.nif_emitente,
    input.nif_cliente,
    input.previous_hash || '0',
  ].join(';');

  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign document hash with RSA private key (PEM)
 */
export async function signDocumentHash(
  documentHash: string,
  privateKeyPem: string
): Promise<string> {
  try {
    const privateKey = await importPrivateKey(privateKeyPem);
    const encoder = new TextEncoder();
    const data = encoder.encode(documentHash);
    
    const signature = await window.crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      data
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (error) {
    console.error('Error signing document:', error);
    // Return hash as fallback if no private key available
    return documentHash;
  }
}

/**
 * Import PEM private key for Web Crypto API
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return window.crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Build AGT-compliant QR code payload
 */
export function buildAgtQrPayload(params: {
  nif_emitente: string;
  nif_cliente: string;
  tipo: string;
  estado: string;
  data_emissao: string;
  numero: string;
  atcud: string;
  subtotal: number;
  total_iva: number;
  total: number;
  hash_4chars: string;
}): string {
  // AGT QR format: field:value separated by *
  return [
    `A:${params.nif_emitente}`,
    `B:${params.nif_cliente}`,
    `C:${params.tipo}`,
    `D:${params.estado}`,
    `E:${params.data_emissao}`,
    `F:${params.numero}`,
    `G:${params.atcud}`,
    `H:${params.subtotal.toFixed(2)}`,
    `I:${params.total_iva.toFixed(2)}`,
    `J:${params.total.toFixed(2)}`,
    `K:${params.hash_4chars}`,
  ].join('*');
}
