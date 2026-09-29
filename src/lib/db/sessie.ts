import { db } from './client';

export interface Sessie {
  id: number;
  datum: string;
  starttijd: string;
  max_plekken: number;
  status: 'open' | 'gesloten';
}

export interface SessieMetBezetting extends Sessie {
  /** Aanmeldingen die niet geannuleerd zijn. */
  bezet: number;
}

const MET_BEZETTING = `
  SELECT s.id, s.datum, s.starttijd, s.max_plekken, s.status,
         (SELECT COUNT(*) FROM aanmelding a WHERE a.sessie_id = s.id AND a.status != 'geannuleerd') AS bezet
  FROM sessie s`;

/** Open sessies van vandaag of later, oplopend op datum. */
export async function komendeSessies(vandaag: string): Promise<SessieMetBezetting[]> {
  const { results } = await db()
    .prepare(`${MET_BEZETTING} WHERE s.status = 'open' AND s.datum >= ?1 ORDER BY s.datum`)
    .bind(vandaag)
    .all<SessieMetBezetting>();
  return results;
}

/** Eerstvolgende open sessie waar nog plek is, of null. */
export async function eerstvolgendeSessieMetPlek(vandaag: string): Promise<SessieMetBezetting | null> {
  return db()
    .prepare(`SELECT * FROM (${MET_BEZETTING} WHERE s.status = 'open' AND s.datum >= ?1) WHERE bezet < max_plekken ORDER BY datum LIMIT 1`)
    .bind(vandaag)
    .first<SessieMetBezetting>();
}

/** Alle sessies, nieuwste eerst. */
export async function alleSessies(): Promise<SessieMetBezetting[]> {
  const { results } = await db().prepare(`${MET_BEZETTING} ORDER BY s.datum DESC`).bind().all<SessieMetBezetting>();
  return results;
}

export function sessieOpId(id: number): Promise<Sessie | null> {
  return db()
    .prepare('SELECT id, datum, starttijd, max_plekken, status FROM sessie WHERE id = ?1')
    .bind(id)
    .first<Sessie>();
}

/** Standaard in de werklijst: de eerstvolgende sessie, anders de laatste. */
export function standaardWerklijstSessie(vandaag: string): Promise<Sessie | null> {
  return db()
    .prepare(
      `SELECT id, datum, starttijd, max_plekken, status FROM sessie
       ORDER BY (datum >= ?1) DESC, CASE WHEN datum >= ?1 THEN datum END ASC, datum DESC
       LIMIT 1`,
    )
    .bind(vandaag)
    .first<Sessie>();
}

export type NieuweSessie = Pick<Sessie, 'datum' | 'starttijd' | 'max_plekken'>;

/** Maakt een open sessie aan. Geeft 'dubbel' als er al een sessie op die datum is. */
export async function maakSessie(s: NieuweSessie): Promise<{ soort: 'ok'; id: number } | { soort: 'dubbel' }> {
  const rij = await db()
    .prepare(
      `INSERT INTO sessie (datum, starttijd, max_plekken, status)
       VALUES (?1, ?2, ?3, 'open')
       ON CONFLICT (datum) DO NOTHING
       RETURNING id`,
    )
    .bind(s.datum, s.starttijd, s.max_plekken)
    .first<{ id: number }>();
  return rij ? { soort: 'ok', id: rij.id } : { soort: 'dubbel' };
}
