// Gedeelde hulpfuncties voor alle formulieren: velden lezen, valideren en fouten teruggeven.
// Elke pagina met een formulier gebruikt leesFormulier en valideer. Zo werkt elk formulier hetzelfde
// en staat deze logica maar op één plek.
import type { z } from 'astro/zod';

/** Veldfouten als { veld: melding }, in het Nederlands. */
export type Fouten = Record<string, string>;

// Het resultaat is óf gelukt (met schone data) óf mislukt (met fouten en de ingevulde waarden).
// De waarden geven we terug zodat het formulier na een fout ingevuld blijft.
export type Validatie<T> = { succes: true; data: T } | { succes: false; fouten: Fouten; waarden: Record<string, string> };

/**
 * Leest de opgegeven velden uit een formulier. Ontbrekende velden worden een lege string,
 * zodat de schema's altijd een tekst krijgen en hun eigen melding geven.
 */
export function leesFormulier(form: FormData, velden: readonly string[]): Record<string, string> {
  // We lezen alleen de velden die we verwachten. Extra velden die een aanvaller meestuurt, negeren we.
  const uit: Record<string, string> = {};
  for (const veld of velden) {
    const waarde = form.get(veld);
    uit[veld] = typeof waarde === 'string' ? waarde : '';
  }
  return uit;
}

/** Valideert met een Zod-schema en zet fouten om naar één melding per veld (de eerste). */
export function valideer<S extends z.ZodType>(schema: S, waarden: Record<string, string>): Validatie<z.output<S>> {
  // safeParse gooit geen fout bij ongeldige invoer, maar geeft het resultaat terug. Ongeldige invoer is normaal.
  const resultaat = schema.safeParse(waarden);
  if (resultaat.success) return { succes: true, data: resultaat.data };
  const fouten: Fouten = {};
  for (const issue of resultaat.error.issues) {
    const veld = String(issue.path[0] ?? 'formulier');
    fouten[veld] ??= issue.message;
  }
  return { succes: false, fouten, waarden };
}

/**
 * Is de tekst een geheel getal binnen het bereik?
 * We eisen eerst alleen cijfers (maximaal 6). Number("1e3") of Number("0x10") zouden anders ook slagen.
 */
export function isHeelGetalTussen(v: string, min: number, max: number): boolean {
  return /^\d{1,6}$/.test(v) && Number(v) >= min && Number(v) <= max;
}
