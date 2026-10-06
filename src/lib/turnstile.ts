// Bot-controle met Cloudflare Turnstile (TE-05). Gebruikt door pages/aanmelden/index.astro.
// Turnstile is een CAPTCHA-alternatief: de browser krijgt een token, de server vraagt bij Cloudflare of het echt is.
// Dat tweede deel (siteverify) is de eigenlijke beveiliging. Een token alleen in de browser controleren is waardeloos.
import { env } from 'cloudflare:workers';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResultaat {
  success?: boolean;
  action?: string;
  hostname?: string;
  metadata?: { result_with_testing_key?: boolean };
}

/**
 * TE-05: controleert het Turnstile-token aan de serverkant (fail closed).
 * Eisen: success, de verwachte actie en een toegestane hostname (TURNSTILE_HOSTNAMES).
 * Uitslagen van de publieke testsleutels tellen alleen als TURNSTILE_TESTMODUS=aan (alleen in .dev.vars).
 *
 * Fail closed: bij elke twijfel of fout (Cloudflare onbereikbaar, timeout, vreemd antwoord) geven we false.
 * Dan wordt de aanmelding geweigerd. Liever een echte bezoeker even opnieuw laten proberen dan bots doorlaten.
 * De actie en hostname controleren we ook: zo kan een token dat voor een andere site of pagina is gemaakt niet hier worden gebruikt.
 */
export async function verifieerTurnstile(token: string, ip: string | undefined, actie: string): Promise<boolean> {
  const hostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
  );
  // Geen token, een absurd lang token of geen secret key ingesteld: meteen weigeren, zonder Cloudflare te bellen.
  if (!token || token.length > 2048 || !env.TURNSTILE_SECRET_KEY) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);

  let r: SiteverifyResultaat;
  try {
    // De timeout voorkomt dat een trage Cloudflare onze pagina eindeloos laat hangen.
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return false;
    r = (await res.json()) as SiteverifyResultaat;
  } catch {
    return false;
  }
  if (r.success !== true) return false;

  // De publieke testsleutels van Cloudflare slagen altijd. In productie mogen ze daarom niet meetellen.
  if (r.metadata?.result_with_testing_key) return env.TURNSTILE_TESTMODUS === 'aan';
  return r.action === actie && typeof r.hostname === 'string' && hostnames.has(r.hostname);
}

// De site key mag publiek zijn: de widget in de browser heeft hem nodig om te starten.
export function turnstileSiteKey(): string {
  return env.TURNSTILE_SITE_KEY;
}
