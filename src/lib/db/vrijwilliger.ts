// Queries op de tabel vrijwilliger (de accounts van de crew).
// Gebruikt door de loginpagina (opzoeken op e-mail) en de accountpagina (wijzigen).
// Alleen hier komt de wachtwoordhash uit de database. Verder gaat alleen Gebruiker (zonder hash) rond.
import { db } from './client';
import type { Gebruiker } from '../domein';

export interface VrijwilligerMetHash extends Gebruiker {
  wachtwoord_hash: string;
  salt: string;
}

// Voor het inloggen: zoekt het account op e-mailadres. Het adres is al klein geschreven door het Zod-schema.
export function vrijwilligerOpEmail(email: string): Promise<VrijwilligerMetHash | null> {
  return db()
    .prepare('SELECT id, naam, email, rol, wachtwoord_hash, salt FROM vrijwilliger WHERE email = ?1')
    .bind(email)
    .first<VrijwilligerMetHash>();
}

// Voor de accountpagina: de ingelogde gebruiker heeft een id, geen e-mailadres dat we kunnen vertrouwen na een wijziging.
export function vrijwilligerOpId(id: number): Promise<VrijwilligerMetHash | null> {
  return db()
    .prepare('SELECT id, naam, email, rol, wachtwoord_hash, salt FROM vrijwilliger WHERE id = ?1')
    .bind(id)
    .first<VrijwilligerMetHash>();
}

/**
 * Nieuw e-mailadres. 'dubbel' als een ander account dit adres al heeft (unieke index).
 * We controleren eerst zelf, voor een nette melding. De unieke index vangt daarna het geval op dat
 * twee mensen tegelijk hetzelfde adres kiezen (dan geeft de database een UNIQUE-fout).
 */
export async function wijzigEmail(id: number, email: string): Promise<'ok' | 'dubbel'> {
  const ander = await db().prepare('SELECT id FROM vrijwilliger WHERE email = ?1 AND id != ?2').bind(email, id).first<{ id: number }>();
  if (ander) return 'dubbel';
  try {
    await db().prepare('UPDATE vrijwilliger SET email = ?1 WHERE id = ?2').bind(email, id).run();
    return 'ok';
  } catch (e) {
    if (e instanceof Error && /UNIQUE/i.test(e.message)) return 'dubbel';
    throw e;
  }
}

// Hash en salt horen bij elkaar en worden daarom altijd samen vervangen.
export async function wijzigWachtwoord(id: number, hash: string, salt: string): Promise<void> {
  await db().prepare('UPDATE vrijwilliger SET wachtwoord_hash = ?1, salt = ?2 WHERE id = ?3').bind(hash, salt, id).run();
}
