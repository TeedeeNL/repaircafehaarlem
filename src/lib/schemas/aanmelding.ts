import { z } from 'astro/zod';
import { CATEGORIEEN } from '../domein';

// F-01/F-02: regels uit het technisch ontwerp. De server beslist; de browser helpt alleen.
export const AANMELDING_VELDEN = ['voornaam', 'email', 'categorie', 'merk_type', 'defect', 'sessie_id'] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const aanmeldingSchema = z.object({
  voornaam: z
    .string()
    .trim()
    .min(2, { error: 'Vul je voornaam in (2 tot 40 tekens).' })
    .max(40, { error: 'Vul je voornaam in (2 tot 40 tekens).' }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl' })
    .regex(EMAIL, { error: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl' }),
  categorie: z.enum(CATEGORIEEN, { error: 'Kies een categorie.' }),
  merk_type: z
    .string()
    .trim()
    .min(2, { error: 'Vul merk en type in (2 tot 60 tekens).' })
    .max(60, { error: 'Vul merk en type in (2 tot 60 tekens).' }),
  defect: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (v.length < 20) ctx.addIssue({ code: 'custom', message: `Beschrijf het defect in minimaal 20 tekens (nog ${20 - v.length}).` });
      else if (v.length > 500) ctx.addIssue({ code: 'custom', message: 'Gebruik maximaal 500 tekens.' });
    }),
  sessie_id: z
    .string()
    .regex(/^\d{1,9}$/, { error: 'Kies een sessie.' })
    .transform(Number),
});

export type AanmeldingInvoer = z.output<typeof aanmeldingSchema>;
