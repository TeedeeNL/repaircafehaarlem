import { z } from 'astro/zod';

// F-09: referentienummer en e-mailadres. Een verkeerd formaat geeft dezelfde melding als "niet gevonden",
// zodat een nummer niet te raden is via de reacties.
export const STATUS_VELDEN = ['referentie', 'email'] as const;

export const statusSchema = z.object({
  referentie: z.string().trim().toUpperCase().min(1, { error: 'Vul je referentienummer in.' }).max(20),
  email: z.string().trim().toLowerCase().min(1, { error: 'Vul het e-mailadres van je aanmelding in.' }).max(254),
});
