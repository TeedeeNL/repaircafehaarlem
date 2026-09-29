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
 */
export async function verifieerTurnstile(token: string, ip: string | undefined, actie: string): Promise<boolean> {
  const hostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
  );
  if (!token || token.length > 2048 || !env.TURNSTILE_SECRET_KEY) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);

  let r: SiteverifyResultaat;
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return false;
    r = (await res.json()) as SiteverifyResultaat;
  } catch {
    return false;
  }
  if (r.success !== true) return false;

  if (r.metadata?.result_with_testing_key) return env.TURNSTILE_TESTMODUS === 'aan';
  return r.action === actie && typeof r.hostname === 'string' && hostnames.has(r.hostname);
}

export function turnstileSiteKey(): string {
  return env.TURNSTILE_SITE_KEY;
}
