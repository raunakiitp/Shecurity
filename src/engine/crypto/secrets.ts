// PBKDF2 hashing via Web Crypto — never store plain passwords/PINs
const ITERATIONS = 150_000;

export async function randomSaltHex(bytes = 16): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(bytes));
  return hex(salt);
}

export function hex(buf: ArrayBuffer | Uint8Array): string {
  const view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function pbkdf2Hash(
  password: string,
  saltHex: string,
  iterations = ITERATIONS,
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const salt = hexToBytes(saltHex);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations },
    keyMaterial,
    256,
  );
  return hex(bits);
}

export async function hashSecret(secret: string): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = await randomSaltHex();
  const hash = await pbkdf2Hash(secret, salt);
  return { hash, salt, iterations: ITERATIONS };
}

export async function verifySecret(
  secret: string,
  hash: string,
  salt: string,
  iterations = ITERATIONS,
): Promise<boolean> {
  const computed = await pbkdf2Hash(secret, salt, iterations);
  // constant-time-ish compare
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

export function hexToBytes(hexStr: string): Uint8Array {
  const out = new Uint8Array(hexStr.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return hex(digest);
}
