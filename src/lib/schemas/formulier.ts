import type { z } from 'astro/zod';

/** Veldfouten als { veld: melding }, in het Nederlands. */
export type Fouten = Record<string, string>;

export type Validatie<T> = { succes: true; data: T } | { succes: false; fouten: Fouten; waarden: Record<string, string> };

/**
 * Leest de opgegeven velden uit een formulier. Ontbrekende velden worden een lege string,
 * zodat de schema's altijd een tekst krijgen en hun eigen melding geven.
 */
export function leesFormulier(form: FormData, velden: readonly string[]): Record<string, string> {
  const uit: Record<string, string> = {};
  for (const veld of velden) {
    const waarde = form.get(veld);
    uit[veld] = typeof waarde === 'string' ? waarde : '';
  }
  return uit;
}

/** Valideert met een Zod-schema en zet fouten om naar één melding per veld (de eerste). */
export function valideer<S extends z.ZodType>(schema: S, waarden: Record<string, string>): Validatie<z.output<S>> {
  const resultaat = schema.safeParse(waarden);
  if (resultaat.success) return { succes: true, data: resultaat.data };
  const fouten: Fouten = {};
  for (const issue of resultaat.error.issues) {
    const veld = String(issue.path[0] ?? 'formulier');
    fouten[veld] ??= issue.message;
  }
  return { succes: false, fouten, waarden };
}

/** Is de tekst een geheel getal binnen het bereik? */
export function isHeelGetalTussen(v: string, min: number, max: number): boolean {
  return /^\d{1,6}$/.test(v) && Number(v) >= min && Number(v) <= max;
}
