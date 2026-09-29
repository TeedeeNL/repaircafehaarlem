import { env } from 'cloudflare:workers';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * TE-05: controleert het Turnstile-token aan de serverkant.
 * Een leeg token, een netwerkfout of een time-out telt als mislukt.
 */
export async function verifieerTurnstile(token: string, ip: string | undefined): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function turnstileSiteKey(): string {
  return env.TURNSTILE_SITE_KEY;
}
