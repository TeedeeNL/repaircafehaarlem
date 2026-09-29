import { env } from 'cloudflare:workers';

/**
 * Toegang tot de D1-database. Alle SQL van de app staat in src/lib/db/
 * en gebruikt altijd prepared statements met .bind().
 */
export function db(): D1Database {
  return env.DB;
}
