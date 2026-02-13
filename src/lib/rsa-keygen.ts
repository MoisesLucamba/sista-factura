/**
 * Generate RSA 2048-bit key pair using Web Crypto API
 * Returns PEM-formatted public and private keys
 */
export async function generateRSAKeyPair(): Promise<{
  publicKeyPem: string;
  privateKeyPem: string;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyDer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyDer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = derToPem(publicKeyDer, 'PUBLIC KEY');
  const privateKeyPem = derToPem(privateKeyDer, 'PRIVATE KEY');

  return { publicKeyPem, privateKeyPem };
}

function derToPem(der: ArrayBuffer, label: string): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(der)));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}
