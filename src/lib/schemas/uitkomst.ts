import { z } from 'astro/zod';
import { isHeelGetalTussen } from './formulier';

// F-07: uitkomst, bestede tijd in hele minuten (1 t/m 480) en een notitie van maximaal 300 tekens.
export const UITKOMST_VELDEN = ['aanmelding_id', 'uitkomst', 'minuten', 'notitie'] as const;

const MINUTEN = 'Vul een tijd in van 1 tot en met 480 minuten.';

export const uitkomstSchema = z.object({
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
