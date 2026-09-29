import { db } from './client';
import type { Categorie, Uitkomst } from '../domein';

export interface UitkomstInvoer {
  aanmelding_id: number;
  uitkomst: Uitkomst;
  minuten: number;
  notitie: string;
}

/**
 * F-07: legt de uitkomst vast. Bestaat er al een reparatie, dan wordt die bijgewerkt
 * (unieke index op aanmelding_id). De aanmelding springt in dezelfde transactie naar "afgerond".
 * Geeft de referentie terug, of null als de aanmelding niet bestaat of geannuleerd is.
 */
export async function slaUitkomstOp(invoer: UitkomstInvoer, vrijwilligerId: number): Promise<string | null> {
  const [, bijgewerkt] = await db().batch<Record<string, unknown>>([
    db()
      .prepare(
        `INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten)
         SELECT ?1, ?2, ?3, ?4, ?5
         WHERE EXISTS (SELECT 1 FROM aanmelding WHERE id = ?1 AND status != 'geannuleerd')
         ON CONFLICT (aanmelding_id) DO UPDATE SET
           vrijwilliger_id = excluded.vrijwilliger_id,
           uitkomst = excluded.uitkomst,
           notitie = excluded.notitie,
           minuten = excluded.minuten,
           afgerond_op = datetime('now')`,
      )
      .bind(invoer.aanmelding_id, vrijwilligerId, invoer.uitkomst, invoer.notitie, invoer.minuten),
    db()
      .prepare(`UPDATE aanmelding SET status = 'afgerond' WHERE id = ?1 AND status != 'geannuleerd' RETURNING referentie`)
      .bind(invoer.aanmelding_id),
  ]);
  const rij = bijgewerkt?.results[0] as { referentie: string } | undefined;
  return rij?.referentie ?? null;
}

export interface StatRij {
  categorie: Categorie;
  aantal: number;
  geslaagd: number;
}

/**
 * F-10: reparaties van de laatste zes afgeronde sessies (gesloten of voorbij),
 * per categorie het aantal en het aantal geslaagd (gerepareerd of deels). Geen persoonsgegevens.
 */
export async function statistiek(vandaag: string): Promise<{ sessies: number; rijen: StatRij[] }> {
  const afgerond = `
    WITH afgerond AS (
      SELECT s.id FROM sessie s
      WHERE (s.status = 'gesloten' OR s.datum < ?1)
        AND EXISTS (SELECT 1 FROM aanmelding a JOIN reparatie r ON r.aanmelding_id = a.id WHERE a.sessie_id = s.id)
      ORDER BY s.datum DESC
      LIMIT 6
    )`;
  const [telling, rijen] = await db().batch<Record<string, unknown>>([
    db().prepare(`${afgerond} SELECT COUNT(*) AS n FROM afgerond`).bind(vandaag),
    db()
      .prepare(
        `${afgerond}
         SELECT a.categorie, COUNT(*) AS aantal,
                SUM(CASE WHEN r.uitkomst IN ('gerepareerd', 'deels') THEN 1 ELSE 0 END) AS geslaagd
         FROM reparatie r
         JOIN aanmelding a ON a.id = r.aanmelding_id
         WHERE a.sessie_id IN (SELECT id FROM afgerond)
         GROUP BY a.categorie
         ORDER BY aantal DESC, a.categorie`,
      )
      .bind(vandaag),
  ]);
  return {
    sessies: Number((telling?.results[0] as { n: number } | undefined)?.n ?? 0),
    rijen: (rijen?.results ?? []) as unknown as StatRij[],
  };
}
