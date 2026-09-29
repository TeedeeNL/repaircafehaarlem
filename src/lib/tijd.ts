// De Repair Cafe werkt in Nederlandse tijd; de database rekent in UTC.
const DAG = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Datum van vandaag in Amsterdam als yyyy-mm-dd. */
export function vandaag(nu: Date = new Date()): string {
  return DAG.format(nu);
}

/** Huidig jaar in Amsterdam, voor het referentienummer. */
export function huidigJaar(nu: Date = new Date()): string {
  return vandaag(nu).slice(0, 4);
}

/** Klopt de datum echt (geen 31 februari)? */
export function isGeldigeDatum(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}
