import { db } from './client';

// Pogingen voor rate limiting. De sleutel bevat nooit een e-mailadres of IP-adres in leesbare vorm.

const BEWAAR_MS = 60 * 60 * 1000;

/** Registreert een poging en ruimt pogingen ouder dan een uur op. */
export async function registreerPoging(sleutel: string, nu: number): Promise<void> {
  await db().batch([
    db().prepare('DELETE FROM inlogpoging WHERE tijdstip < ?1').bind(nu - BEWAAR_MS),
    db().prepare('INSERT INTO inlogpoging (sleutel, tijdstip) VALUES (?1, ?2)').bind(sleutel, nu),
  ]);
}

/** Aantal pogingen sinds een tijdstip en het tijdstip van de laatste. */
export async function pogingenSinds(sleutel: string, sinds: number): Promise<{ aantal: number; laatste: number | null }> {
  const rij = await db()
    .prepare('SELECT COUNT(*) AS aantal, MAX(tijdstip) AS laatste FROM inlogpoging WHERE sleutel = ?1 AND tijdstip >= ?2')
    .bind(sleutel, sinds)
    .first<{ aantal: number; laatste: number | null }>();
  return { aantal: Number(rij?.aantal ?? 0), laatste: rij?.laatste ?? null };
}

export async function wisPogingen(sleutel: string): Promise<void> {
  await db().prepare('DELETE FROM inlogpoging WHERE sleutel = ?1').bind(sleutel).run();
}
