// Het enige stukje code dat weet waar de database vandaan komt. Alle andere bestanden in
// src/lib/db/ roepen db() aan. Zo hoeft er bij een andere opzet maar één bestand te veranderen.
import { env } from 'cloudflare:workers';

/**
 * Toegang tot de D1-database. Alle SQL van de app staat in src/lib/db/
 * en gebruikt altijd prepared statements met .bind().
 *
 * Prepared statement: de SQL staat vast en de waarden gaan apart mee via .bind(). De database
 * leest een waarde dus nooit als SQL-code. Dat voorkomt SQL-injectie, bijvoorbeeld een
 * voornaam als "x'); DROP TABLE aanmelding;--". "DB" is de naam van de binding in wrangler.toml.
 */
export function db(): D1Database {
  return env.DB;
}
