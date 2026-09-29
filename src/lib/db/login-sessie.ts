import { db } from './client';
import type { Gebruiker } from '../domein';

/** tokenHash = SHA-256 van de cookiewaarde; de waarde zelf staat nooit in de database. */
export async function maakLoginSessie(tokenHash: string, vrijwilligerId: number, verlooptOp: number): Promise<void> {
  await db().batch([
    db().prepare('DELETE FROM login_sessie WHERE verloopt_op <= ?1').bind(Math.floor(Date.now() / 1000)),
    db()
      .prepare('INSERT INTO login_sessie (token, vrijwilliger_id, verloopt_op) VALUES (?1, ?2, ?3)')
      .bind(tokenHash, vrijwilligerId, verlooptOp),
  ]);
}

/** De ingelogde gebruiker bij een geldige, niet verlopen sessie. */
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

export async function verwijderLoginSessie(tokenHash: string): Promise<void> {
  await db().prepare('DELETE FROM login_sessie WHERE token = ?1').bind(tokenHash).run();
}
