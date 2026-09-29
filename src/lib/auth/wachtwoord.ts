// TE-04: PBKDF2-SHA256 via Web Crypto, 100.000 iteraties (het maximum in Workers), 16 bytes salt per gebruiker.
// Zelfde parameters als scripts/hash-wachtwoord.mjs.
const ITERATIES = 100_000;
const BITS = 256;

const naarHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const vanHex = (hex: string) => new Uint8Array((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)));

async function afleiden(wachtwoord: string, salt: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const sleutel = await crypto.subtle.importKey('raw', new TextEncoder().encode(wachtwoord), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIES }, sleutel, BITS);
}

export async function hashWachtwoord(wachtwoord: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: naarHex(await afleiden(wachtwoord, salt)), salt: naarHex(salt) };
}

/** Vergelijkt in constante tijd. */
export async function controleerWachtwoord(wachtwoord: string, saltHex: string, hashHex: string): Promise<boolean> {
  const berekend = new Uint8Array(await afleiden(wachtwoord, vanHex(saltHex)));
  const opgeslagen = vanHex(hashHex);
  if (berekend.byteLength !== opgeslagen.byteLength) return false;
  let verschil = 0;
  for (let i = 0; i < berekend.byteLength; i++) verschil |= berekend[i]! ^ opgeslagen[i]!;
  return verschil === 0;
}

/**
 * Bij een onbekend e-mailadres toch een hash berekenen, zodat de responstijd
 * niet verraadt of het adres bestaat.
 */
export async function doeAlsofControle(wachtwoord: string): Promise<false> {
  await afleiden(wachtwoord, new Uint8Array(16));
  return false;
}

export async function sha256Hex(tekst: string): Promise<string> {
  return naarHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst)));
}
