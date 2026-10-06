// Validatie voor de statusopvraag (FE-09). Gebruikt door pages/status.astro.
import { z } from 'astro/zod';

// FE-09: referentienummer en e-mailadres. Een verkeerd formaat geeft dezelfde melding als "niet gevonden",
// zodat een nummer niet te raden is via de reacties.
export const STATUS_VELDEN = ['referentie', 'email'] as const;

// toUpperCase: rc-2026-0009 en RC-2026-0009 zijn voor de bezoeker hetzelfde, en zo staat het ook in de database.
export const statusSchema = z.object({
  referentie: z.string().trim().toUpperCase().min(1, { error: 'Vul je referentienummer in.' }).max(20),
  email: z.string().trim().toLowerCase().min(1, { error: 'Vul het e-mailadres van je aanmelding in.' }).max(254),
});
