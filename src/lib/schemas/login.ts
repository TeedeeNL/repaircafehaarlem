import { z } from 'astro/zod';

// F-05: alleen aanwezigheid controleren; of de combinatie klopt, zegt altijd dezelfde melding.
export const LOGIN_VELDEN = ['email', 'wachtwoord'] as const;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, { error: 'Vul je e-mailadres in.' }).max(254),
  wachtwoord: z.string().min(1, { error: 'Vul je wachtwoord in.' }).max(200),
});
