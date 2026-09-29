import { z } from 'astro/zod';
import { isHeelGetalTussen } from './formulier';
import { isGeldigeDatum } from '../tijd';

// F-08: datum vandaag of later, starttijd en 1 t/m 40 plekken. "Vandaag" komt van de server.
export const SESSIE_VELDEN = ['datum', 'starttijd', 'max_plekken'] as const;

const PLEKKEN = 'Aantal plekken: kies 1 tot en met 40.';

export function sessieSchema(vandaag: string) {
  return z.object({
    datum: z
      .string()
      .trim()
      .refine(isGeldigeDatum, { error: 'Kies een datum.' })
      .refine((d) => d >= vandaag, { error: 'Kies een datum van vandaag of later.' }),
    starttijd: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Vul een starttijd in.' }),
    max_plekken: z
      .string()
      .trim()
      .refine((v) => isHeelGetalTussen(v, 1, 40), { error: PLEKKEN })
      .transform(Number),
  });
}
