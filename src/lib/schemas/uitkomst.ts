// Validatie voor het vastleggen van een reparatie-uitkomst door een vrijwilliger (FE-07). Gebruikt door pages/crew.astro.
// De grenzen (1 t/m 480 minuten, 300 tekens) staan ook als CHECK in de database (migrations/0001_init.sql).
// Zo is er een tweede vangnet als de applicatie ooit een fout zou maken.
import { z } from 'astro/zod';
import { isHeelGetalTussen } from './formulier';

// FE-07: uitkomst, bestede tijd in hele minuten (1 t/m 480) en een notitie van maximaal 300 tekens.
export const UITKOMST_VELDEN = ['aanmelding_id', 'uitkomst', 'minuten', 'notitie'] as const;

const MINUTEN = 'Vul een tijd in van 1 tot en met 480 minuten.';

export const uitkomstSchema = z.object({
  // Het id komt uit een verborgen formulierveld. Dat kan een gebruiker aanpassen, dus we controleren het
  // hier op vorm en in slaUitkomstOp (db/reparatie.ts) of de aanmelding bestaat.
  aanmelding_id: z
    .string()
    .regex(/^\d{1,9}$/, { error: 'Onbekende aanmelding.' })
    .transform(Number),
  uitkomst: z.enum(['gerepareerd', 'deels', 'niet_gelukt'], { error: 'Kies een uitkomst.' }),
  minuten: z
    .string()
    .trim()
    .refine((v) => isHeelGetalTussen(v, 1, 480), { error: MINUTEN })
    .transform(Number),
  notitie: z.string().trim().max(300, { error: 'Gebruik maximaal 300 tekens.' }),
});

export type UitkomstFormulier = z.output<typeof uitkomstSchema>;
