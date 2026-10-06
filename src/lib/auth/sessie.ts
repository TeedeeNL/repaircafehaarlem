// Inloggen onthouden met een sessiecookie (FE-05).
// Gebruikt door de middleware (huidigeGebruiker), de loginpagina (startSessie), /uitloggen
// (beeindigSessie) en de accountpagina (huidigeTokenHash). De database-kant staat in db/login-sessie.ts.
import type { AstroCookies } from 'astro';
import type { Gebruiker } from '../domein';
import { gebruikerBijToken, maakLoginSessie, verwijderLoginSessie } from '../db/login-sessie';
import { sha256Hex } from './wachtwoord';

// FE-05: willekeurig token in een cookie (HttpOnly, Secure, SameSite=Lax, 8 uur).
// In login_sessie staat alleen de SHA-256 van het token.
//
// Cookie-attributen (instellingen die de browser bij het cookie krijgt):
// - HttpOnly: JavaScript op de pagina kan het cookie niet lezen. Dat beperkt de schade van XSS.
// - Secure: het cookie gaat alleen mee over https.
// - SameSite=Lax: het cookie gaat niet mee bij POST-verzoeken van andere sites. Dat helpt tegen CSRF.
// - maxAge: na 8 uur gooit de browser het cookie weg.
// Waarom alleen de hash in de database? Lekt de database, dan kan niemand met die hashes inloggen.
export const SESSIE_COOKIE = 'rc_sessie';
const GELDIG_S = 8 * 60 * 60;

// 32 willekeurige bytes (256 bits) als hex. Dat is niet te raden, ook niet met miljoenen pogingen.
function nieuwToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Wordt na een geslaagde login aangeroepen: bewaart de hash in de database en geeft de browser het token.
export async function startSessie(cookies: AstroCookies, vrijwilligerId: number): Promise<void> {
  const token = nieuwToken();
  await maakLoginSessie(await sha256Hex(token), vrijwilligerId, Math.floor(Date.now() / 1000) + GELDIG_S);
  cookies.set(SESSIE_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GELDIG_S });
}

// Zoekt bij het cookie van dit verzoek de ingelogde vrijwilliger, of null als er niemand is.
export async function huidigeGebruiker(cookies: AstroCookies): Promise<Gebruiker | null> {
  const token = cookies.get(SESSIE_COOKIE)?.value;
  // Beveiliging: we controleren eerst het formaat (64 hextekens). Een verzonnen cookie haalt zo
  // niet eens de database aan.
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return gebruikerBijToken(await sha256Hex(token), Math.floor(Date.now() / 1000));
}

// Uitloggen: de sessie moet ook aan de serverkant verdwijnen. Alleen het cookie wissen is niet genoeg,
// want iemand die het token had gekopieerd kan het anders nog gebruiken tot het verloopt.
export async function beeindigSessie(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSIE_COOKIE)?.value;
  if (token && /^[0-9a-f]{64}$/.test(token)) await verwijderLoginSessie(await sha256Hex(token));
  cookies.delete(SESSIE_COOKIE, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
}

/**
 * SHA-256 van het token van de huidige sessie, of null.
 * Nodig bij een nieuw wachtwoord: dan beëindigen we alle andere sessies, maar houden we deze.
 */
export async function huidigeTokenHash(cookies: AstroCookies): Promise<string | null> {
  const token = cookies.get(SESSIE_COOKIE)?.value;
  return token && /^[0-9a-f]{64}$/.test(token) ? sha256Hex(token) : null;
}
