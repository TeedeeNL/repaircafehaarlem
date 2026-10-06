// Validatieregels voor het aanmeldformulier (FE-01, FE-02). Gebruikt door pages/aanmelden/index.astro.
// Een Zod-schema is een beschrijving van hoe geldige invoer eruitziet. Zod controleert de invoer,
// maakt hem schoon (trim, kleine letters) en geeft per veld een Nederlandse foutmelding.
// De browser controleert ook (required, maxlength), maar dat is alleen gemak: een aanvaller slaat dat over.
// De server beslist dus altijd opnieuw, met dit schema.
import { z } from 'astro/zod';
import { CATEGORIEEN } from '../domein';

// FE-01/FE-02: regels uit het technisch ontwerp. De server beslist; de browser helpt alleen.
// Deze lijst bepaalt welke formuliervelden we uit het verzoek lezen. Andere velden negeren we.
export const AANMELDING_VELDEN = ['voornaam', 'email', 'categorie', 'merk_type', 'defect', 'sessie_id'] as const;

// Bewust eenvoudig: iets@iets.xx. Echt controleren of het adres bestaat kan alleen door een mail te sturen.
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
  // z.enum laat alleen waarden uit de vaste lijst toe (lib/domein.ts). Een verzonnen categorie wordt geweigerd.
  categorie: z.enum(CATEGORIEEN, { error: 'Kies een categorie.' }),
  merk_type: z
    .string()
    .trim()
    .min(2, { error: 'Vul merk en type in (2 tot 60 tekens).' })
    .max(60, { error: 'Vul merk en type in (2 tot 60 tekens).' }),
  // superRefine laat ons zelf bepalen welke melding erbij hoort. Zo kunnen we tonen hoeveel tekens nog ontbreken.
  defect: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (v.length < 20) ctx.addIssue({ code: 'custom', message: `Beschrijf het defect in minimaal 20 tekens (nog ${20 - v.length}).` });
      else if (v.length > 500) ctx.addIssue({ code: 'custom', message: 'Gebruik maximaal 500 tekens.' });
    }),
  // Een formulier verstuurt alles als tekst. We eisen alleen cijfers en zetten het daarna om naar een getal.
  // Of de sessie echt bestaat en open is, controleert de database (maakAanmelding).
  sessie_id: z
    .string()
    .regex(/^\d{1,9}$/, { error: 'Kies een sessie.' })
    .transform(Number),
});

export type AanmeldingInvoer = z.output<typeof aanmeldingSchema>;
