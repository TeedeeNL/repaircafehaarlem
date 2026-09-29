import type { AstroCookies } from 'astro';
import type { Gebruiker } from '../domein';
import { gebruikerBijToken, maakLoginSessie, verwijderLoginSessie } from '../db/login-sessie';
import { sha256Hex } from './wachtwoord';

// F-05: willekeurig token in een cookie (HttpOnly, Secure, SameSite=Lax, 8 uur).
// In login_sessie staat alleen de SHA-256 van het token.
export const SESSIE_COOKIE = 'rc_sessie';
const GELDIG_S = 8 * 60 * 60;

function nieuwToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function startSessie(cookies: AstroCookies, vrijwilligerId: number): Promise<void> {
  const token = nieuwToken();
  await maakLoginSessie(await sha256Hex(token), vrijwilligerId, Math.floor(Date.now() / 1000) + GELDIG_S);
  cookies.set(SESSIE_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GELDIG_S });
}

export async function huidigeGebruiker(cookies: AstroCookies): Promise<Gebruiker | null> {
  const token = cookies.get(SESSIE_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return gebruikerBijToken(await sha256Hex(token), Math.floor(Date.now() / 1000));
}

export async function beeindigSessie(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSIE_COOKIE)?.value;
  if (token && /^[0-9a-f]{64}$/.test(token)) await verwijderLoginSessie(await sha256Hex(token));
  cookies.delete(SESSIE_COOKIE, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
}
