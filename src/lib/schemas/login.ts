// Validatie voor het loginformulier (FE-05). Gebruikt door pages/login.astro.
import { z } from 'astro/zod';

// FE-05: alleen aanwezigheid controleren; of de combinatie klopt, zegt altijd dezelfde melding.
// Beveiliging: we eisen hier bewust geen minimale lengte of vorm voor het wachtwoord. Dan zou een foutmelding
// verraden hoe een wachtwoord eruit moet zien. De maximale lengte (200) voorkomt dat iemand een enorme
// tekst opstuurt om de server onnodig lang te laten rekenen.
export const LOGIN_VELDEN = ['email', 'wachtwoord'] as const;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, { error: 'Vul je e-mailadres in.' }).max(254),
  wachtwoord: z.string().min(1, { error: 'Vul je wachtwoord in.' }).max(200),
});
