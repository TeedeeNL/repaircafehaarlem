// Queries op de tabel inlogpoging, de teller voor rate limiting.
// Alleen src/lib/auth/limiet.ts gebruikt dit bestand. Daar staat ook de reden en de regels (5 pogingen,
// 15 minuten blokkade). Hier staat alleen het opslaan en tellen.
import { db } from './client';

// Pogingen voor rate limiting. De sleutel bevat nooit een e-mailadres of IP-adres in leesbare vorm.

// Pogingen ouder dan een uur zijn nergens meer nodig (de langste periode is 15 minuten).
const BEWAAR_MS = 60 * 60 * 1000;

/**
 * Registreert een poging en ruimt pogingen ouder dan een uur op.
 * Batch: D1 voert beide statements samen uit, als één transactie. Of ze lukken allebei, of geen van beide.
 * Opruimen gebeurt hier bij het schrijven, zodat de tabel klein blijft zonder aparte opruimtaak.
 */
export async function registreerPoging(sleutel: string, nu: number): Promise<void> {
  await db().batch([
    db().prepare('DELETE FROM inlogpoging WHERE tijdstip < ?1').bind(nu - BEWAAR_MS),
    db().prepare('INSERT INTO inlogpoging (sleutel, tijdstip) VALUES (?1, ?2)').bind(sleutel, nu),
  ]);
}

/**
 * Aantal pogingen sinds een tijdstip en het tijdstip van de laatste.
 * De index idx_inlogpoging_sleutel maakt dit snel, ook als de tabel groeit.
 */
export async function pogingenSinds(sleutel: string, sinds: number): Promise<{ aantal: number; laatste: number | null }> {
  const rij = await db()
    .prepare('SELECT COUNT(*) AS aantal, MAX(tijdstip) AS laatste FROM inlogpoging WHERE sleutel = ?1 AND tijdstip >= ?2')
    .bind(sleutel, sinds)
    .first<{ aantal: number; laatste: number | null }>();
  return { aantal: Number(rij?.aantal ?? 0), laatste: rij?.laatste ?? null };
}

// Verwijdert alle pogingen van één sleutel, bijvoorbeeld na een geslaagde login.
export async function wisPogingen(sleutel: string): Promise<void> {
  await db().prepare('DELETE FROM inlogpoging WHERE sleutel = ?1').bind(sleutel).run();
}
