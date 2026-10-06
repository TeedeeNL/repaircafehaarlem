// Queries op de tabel login_sessie: wie is er op dit moment ingelogd.
// Gebruikt door src/lib/auth/sessie.ts (en daarmee door de middleware en de loginpagina).
// Hier staat alleen de hash van het cookie-token, nooit het token zelf (FE-05).
import { db } from './client';
import type { Gebruiker } from '../domein';

/**
 * tokenHash = SHA-256 van de cookiewaarde; de waarde zelf staat nooit in de database.
 * We ruimen in dezelfde batch (één transactie) verlopen sessies op, zodat de tabel niet volloopt.
 */
export async function maakLoginSessie(tokenHash: string, vrijwilligerId: number, verlooptOp: number): Promise<void> {
  await db().batch([
    db().prepare('DELETE FROM login_sessie WHERE verloopt_op <= ?1').bind(Math.floor(Date.now() / 1000)),
    db()
      .prepare('INSERT INTO login_sessie (token, vrijwilliger_id, verloopt_op) VALUES (?1, ?2, ?3)')
      .bind(tokenHash, vrijwilligerId, verlooptOp),
  ]);
}

/**
 * De ingelogde gebruiker bij een geldige, niet verlopen sessie.
 * De middleware roept dit bij elk beschermd verzoek aan. "verloopt_op > nu" zorgt dat een
 * verlopen sessie ook echt niet meer werkt, zelfs als de rij nog niet is opgeruimd.
 * We selecteren bewust geen wachtwoord_hash: die heeft de rest van de app hier niet nodig.
 */
export function gebruikerBijToken(tokenHash: string, nu: number): Promise<Gebruiker | null> {
  return db()
    .prepare(
      `SELECT v.id, v.naam, v.email, v.rol
       FROM login_sessie l JOIN vrijwilliger v ON v.id = l.vrijwilliger_id
       WHERE l.token = ?1 AND l.verloopt_op > ?2`,
    )
    .bind(tokenHash, nu)
    .first<Gebruiker>();
}

// Uitloggen: de rij weghalen maakt het token meteen ongeldig.
export async function verwijderLoginSessie(tokenHash: string): Promise<void> {
  await db().prepare('DELETE FROM login_sessie WHERE token = ?1').bind(tokenHash).run();
}

/**
 * Beëindigt alle andere sessies van een vrijwilliger (bijv. na een nieuw wachtwoord).
 * Beveiliging: als iemand anders het oude wachtwoord kende en ingelogd is, wordt die persoon zo uitgelogd.
 */
export async function verwijderAndereSessies(vrijwilligerId: number, behoudTokenHash: string): Promise<void> {
  await db().prepare('DELETE FROM login_sessie WHERE vrijwilliger_id = ?1 AND token != ?2').bind(vrijwilligerId, behoudTokenHash).run();
}
