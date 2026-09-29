import { pogingenSinds, registreerPoging, wisPogingen } from '../db/inlogpoging';
import { sha256Hex } from './wachtwoord';

// Rate limiting (F-05, F-09). Sleutels bevatten een hash, nooit het e-mailadres of IP-adres zelf.
const MIN = 60 * 1000;

const loginSleutel = async (email: string) => `login:${await sha256Hex(email.toLowerCase())}`;
const blokSleutel = async (email: string) => `blokkade:${await sha256Hex(email.toLowerCase())}`;

/** Geblokkeerd na 5 mislukte pogingen binnen 10 minuten, voor 15 minuten. */
export async function loginBlokkade(email: string, nu = Date.now()): Promise<{ geblokkeerd: boolean; minuten: number }> {
  const { aantal, laatste } = await pogingenSinds(await blokSleutel(email), nu - 15 * MIN);
  if (!aantal || laatste === null) return { geblokkeerd: false, minuten: 0 };
  return { geblokkeerd: true, minuten: Math.max(1, Math.ceil((laatste + 15 * MIN - nu) / MIN)) };
}

/** Registreert een mislukte poging; geeft true als het account daardoor nu geblokkeerd is. */
export async function registreerMislukteLogin(email: string, nu = Date.now()): Promise<boolean> {
  const sleutel = await loginSleutel(email);
  await registreerPoging(sleutel, nu);
  const { aantal } = await pogingenSinds(sleutel, nu - 10 * MIN);
  if (aantal < 5) return false;
  await registreerPoging(await blokSleutel(email), nu);
  await wisPogingen(sleutel);
  return true;
}

export async function wisMislukteLogins(email: string): Promise<void> {
  await wisPogingen(await loginSleutel(email));
}

/** Statusopvraag: maximaal 10 pogingen per kwartier per IP-adres. Registreert deze poging. */
export async function statusOpvraagToegestaan(ip: string, nu = Date.now()): Promise<boolean> {
  const sleutel = `status:${await sha256Hex(ip)}`;
  const { aantal } = await pogingenSinds(sleutel, nu - 15 * MIN);
  if (aantal >= 10) return false;
  await registreerPoging(sleutel, nu);
  return true;
}
