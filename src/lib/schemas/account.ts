// Validatie voor "Mijn account": e-mailadres of wachtwoord wijzigen. Gebruikt door pages/crew/account.astro.
// Dit controleert alleen de vorm van de invoer. Of het huidige wachtwoord klopt, bepaalt de pagina zelf
// met controleerWachtwoord (lib/auth/wachtwoord.ts).
import { z } from 'astro/zod';

// Mijn account: wijzigen vraagt altijd het huidige wachtwoord.
// Beveiliging: zo kan iemand met een onbeheerde, ingelogde laptop het account niet overnemen.
export const EMAIL_WIJZIG_VELDEN = ['nieuw_email', 'huidig_wachtwoord'] as const;
export const WACHTWOORD_WIJZIG_VELDEN = ['huidig_wachtwoord', 'nieuw_wachtwoord', 'herhaal_wachtwoord'] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HUIDIG = z.string().min(1, { error: 'Vul je huidige wachtwoord in.' }).max(200);

export const emailWijzigSchema = z.object({
  nieuw_email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl' })
    .regex(EMAIL, { error: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl' }),
  huidig_wachtwoord: HUIDIG,
});

export const wachtwoordWijzigSchema = z
  .object({
    huidig_wachtwoord: HUIDIG,
    nieuw_wachtwoord: z
      .string()
      .min(12, { error: 'Kies een wachtwoord van minimaal 12 tekens.' })
      .max(200, { error: 'Gebruik maximaal 200 tekens.' }),
    herhaal_wachtwoord: z.string(),
  })
  // Controles die meerdere velden samen vergelijken kunnen niet per veld. Daarom staat dit op het hele object.
  // Met "path" koppelen we de melding aan het juiste veld, zodat hij onder dat veld verschijnt.
  .superRefine((d, ctx) => {
    if (d.nieuw_wachtwoord !== d.herhaal_wachtwoord) {
      ctx.addIssue({ code: 'custom', path: ['herhaal_wachtwoord'], message: 'De wachtwoorden zijn niet gelijk.' });
    }
    if (d.nieuw_wachtwoord && d.nieuw_wachtwoord === d.huidig_wachtwoord) {
      ctx.addIssue({ code: 'custom', path: ['nieuw_wachtwoord'], message: 'Kies een ander wachtwoord dan je huidige.' });
    }
  });
