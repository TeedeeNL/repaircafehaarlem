// Maakt een wachtwoordhash met dezelfde parameters als src/lib/auth/wachtwoord.ts.
// Gebruik: node scripts/hash-wachtwoord.mjs <wachtwoord>
// Uitvoer: salt en hash (hex), om een vrijwilliger toe te voegen met wrangler d1 execute.
import { webcrypto as crypto } from 'node:crypto';

const ITERATIES = 100_000;

const hex = (buf) => Buffer.from(buf).toString('hex');

export async function hashWachtwoord(wachtwoord, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.getRandomValues(new Uint8Array(16));
  const sleutel = await crypto.subtle.importKey('raw', new TextEncoder().encode(wachtwoord), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIES }, sleutel, 256);
  return { salt: hex(salt), hash: hex(bits) };
}

if (process.argv[1]?.endsWith('hash-wachtwoord.mjs')) {
  const wachtwoord = process.argv[2];
  if (!wachtwoord) {
    console.error('Gebruik: node scripts/hash-wachtwoord.mjs <wachtwoord>');
    process.exit(1);
  }
  const { salt, hash } = await hashWachtwoord(wachtwoord);
  console.log(`salt: ${salt}\nhash: ${hash}`);
}
