// Datumnotatie zonder afhankelijkheid van de ICU-data van de runtime.
const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

function parse(iso: string): Date {
  const [j, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(j!, m! - 1, d!));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Zaterdag 7 november 2026" (jaar optioneel) */
export function datumLang(iso: string, metJaar = true): string {
  const d = parse(iso);
  const s = `${DAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]}`;
  return cap(metJaar ? `${s} ${d.getUTCFullYear()}` : s);
}

/** "Za 7 november" (jaar optioneel) */
export function datumKort(iso: string, metJaar = false): string {
  const d = parse(iso);
  const s = `${DAGEN[d.getUTCDay()]!.slice(0, 2)} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]}`;
  return cap(metJaar ? `${s} ${d.getUTCFullYear()}` : s);
}

/** "7 november 2026" */
export function datum(iso: string): string {
  const d = parse(iso);
  return `${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function plekken(n: number): string {
  return `${n} ${n === 1 ? 'plek' : 'plekken'}`;
}
