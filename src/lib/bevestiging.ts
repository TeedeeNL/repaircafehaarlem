import type { AstroCookies } from 'astro';

/**
 * Na een geslaagde aanmelding onthoudt de browser (en alleen die) welke aanmelding hij net deed,
 * zodat /aanmelden/bevestiging na de redirect de juiste gegevens kan tonen.
 * Het bevestigingsscherm haalt de aanmelding op met referentie + e-mail, net als de statusopvraag.
 */
const NAAM = 'rc_bevestiging';

export interface Bevestiging {
  referentie: string;
  email: string;
  mailVerstuurd: boolean;
}

export function onthoudBevestiging(cookies: AstroCookies, b: Bevestiging): void {
  cookies.set(NAAM, JSON.stringify(b), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/aanmelden',
    maxAge: 30 * 60,
  });
}

export function leesBevestiging(cookies: AstroCookies): Bevestiging | null {
  try {
    const b = cookies.get(NAAM)?.json() as Partial<Bevestiging> | undefined;
    if (typeof b?.referentie === 'string' && typeof b.email === 'string' && typeof b.mailVerstuurd === 'boolean') {
      return { referentie: b.referentie, email: b.email, mailVerstuurd: b.mailVerstuurd };
    }
  } catch {
    // Ongeldige cookie: behandelen als geen bevestiging.
  }
  return null;
}
