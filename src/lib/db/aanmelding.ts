import { db } from './client';
import type { AanmeldingStatus, Categorie, Uitkomst } from '../domein';

export interface NieuweAanmelding {
  sessie_id: number;
  voornaam: string;
  email: string;
  categorie: Categorie;
  merk_type: string;
  defect: string;
}

export type AanmeldResultaat =
  | { soort: 'ok'; id: number; referentie: string }
  | { soort: 'vol' }
  | { soort: 'ongeldige_sessie' };

/**
 * F-01 + F-03: plekcontrole en insert in één statement binnen een batch (één transactie),
 * zodat twee gelijktijdige aanmeldingen het maximum niet kunnen overschrijden.
 * Referentienummer: RC-JJJJ-NNNN, oplopend per jaar.
 */
export async function maakAanmelding(a: NieuweAanmelding, jaar: string, vandaag: string): Promise<AanmeldResultaat> {
  const [invoegen, sessie] = await db().batch<Record<string, unknown>>([
    db()
      .prepare(
        `INSERT INTO aanmelding (referentie, sessie_id, voornaam, email, categorie, merk_type, defect)
         SELECT 'RC-' || ?1 || '-' || printf('%04d', COALESCE(
                  (SELECT MAX(CAST(substr(referentie, 9) AS INTEGER)) FROM aanmelding WHERE referentie LIKE 'RC-' || ?1 || '-%'),
                  0) + 1),
                s.id, ?3, ?4, ?5, ?6, ?7
         FROM sessie s
         WHERE s.id = ?2 AND s.status = 'open' AND s.datum >= ?8
           AND (SELECT COUNT(*) FROM aanmelding x WHERE x.sessie_id = s.id AND x.status != 'geannuleerd') < s.max_plekken
         RETURNING id, referentie`,
      )
      .bind(jaar, a.sessie_id, a.voornaam, a.email, a.categorie, a.merk_type, a.defect, vandaag),
    db()
      .prepare(`SELECT id FROM sessie WHERE id = ?1 AND status = 'open' AND datum >= ?2`)
      .bind(a.sessie_id, vandaag),
  ]);

  const nieuw = invoegen?.results[0] as { id: number; referentie: string } | undefined;
  if (nieuw) return { soort: 'ok', id: nieuw.id, referentie: nieuw.referentie };
  return sessie?.results.length ? { soort: 'vol' } : { soort: 'ongeldige_sessie' };
}

export interface AanmeldingDetail {
  id: number;
  referentie: string;
  email: string;
  merk_type: string;
  status: AanmeldingStatus;
  datum: string;
  starttijd: string;
  uitkomst: Uitkomst | null;
  notitie: string | null;
  minuten: number | null;
}

/** F-09: alleen bij een kloppende combinatie van referentie en e-mailadres. */
export function aanmeldingVoorOpvraag(referentie: string, email: string): Promise<AanmeldingDetail | null> {
  return db()
    .prepare(
      `SELECT a.id, a.referentie, a.email, a.merk_type, a.status, s.datum, s.starttijd,
              r.uitkomst, r.notitie, r.minuten
       FROM aanmelding a
       JOIN sessie s ON s.id = a.sessie_id
       LEFT JOIN reparatie r ON r.aanmelding_id = a.id
       WHERE a.referentie = ?1 AND a.email = ?2`,
    )
    .bind(referentie, email)
    .first<AanmeldingDetail>();
}

export interface WerklijstRij {
  id: number;
  referentie: string;
  categorie: Categorie;
  merk_type: string;
  defect: string;
  status: AanmeldingStatus;
  uitkomst: Uitkomst | null;
  minuten: number | null;
  notitie: string | null;
}

/** F-06: aanmeldingen van een sessie, gesorteerd op volgorde van aanmelden. */
export async function werklijst(
  sessieId: number,
  filter: { categorie: Categorie | null; status: AanmeldingStatus | null },
): Promise<{ totaal: number; rijen: WerklijstRij[] }> {
  const [totaal, rijen] = await db().batch<Record<string, unknown>>([
    db().prepare('SELECT COUNT(*) AS n FROM aanmelding WHERE sessie_id = ?1').bind(sessieId),
    db()
      .prepare(
        `SELECT a.id, a.referentie, a.categorie, a.merk_type, a.defect, a.status,
                r.uitkomst, r.minuten, r.notitie
         FROM aanmelding a
         LEFT JOIN reparatie r ON r.aanmelding_id = a.id
         WHERE a.sessie_id = ?1
           AND (?2 IS NULL OR a.categorie = ?2)
           AND (?3 IS NULL OR a.status = ?3)
         ORDER BY a.id`,
      )
      .bind(sessieId, filter.categorie, filter.status),
  ]);
  return {
    totaal: Number((totaal?.results[0] as { n: number } | undefined)?.n ?? 0),
    rijen: (rijen?.results ?? []) as unknown as WerklijstRij[],
  };
}
