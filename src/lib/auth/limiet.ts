// Rate limiting: het aantal pogingen beperken (FE-05 voor inloggen, FE-09 voor de statusopvraag).
// Gebruikt door de loginpagina, de accountpagina en de statuspagina. De pogingen zelf staan in de
// tabel inlogpoging (zie db/inlogpoging.ts). Zonder dit kan een aanvaller eindeloos wachtwoorden raden.
import { pogingenSinds, registreerPoging, wisPogingen } from '../db/inlogpoging';
import { sha256Hex } from './wachtwoord';

// Sleutels bevatten een hash, nooit het e-mailadres of IP-adres zelf.
// Zo staan er geen persoonsgegevens in de pogingentabel (privacy).
const MIN = 60 * 1000;

// Twee soorten sleutels per e-mailadres: "login:" telt mislukte pogingen, "blokkade:" betekent geblokkeerd.
// toLowerCase zorgt dat Joost@x.nl en joost@x.nl als dezelfde persoon tellen.
const loginSleutel = async (email: string) => `login:${await sha256Hex(email.toLowerCase())}`;
const blokSleutel = async (email: string) => `blokkade:${await sha256Hex(email.toLowerCase())}`;

/**
 * Geblokkeerd na 5 mislukte pogingen binnen 10 minuten, voor 15 minuten.
 * Een blokkade is een regel in de tabel. Is die regel jonger dan 15 minuten, dan geldt de blokkade nog.
 * Het getal "minuten" laat de gebruiker zien hoe lang hij nog moet wachten.
 */
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
  // Vijfde mislukking: zet de blokkade en wis de teller, zodat na de blokkade weer vers wordt geteld.
  await registreerPoging(await blokSleutel(email), nu);
  await wisPogingen(sleutel);
  return true;
}

// Na een geslaagde login begint de teller weer bij nul. Een typefout van gisteren telt dan niet mee.
export async function wisMislukteLogins(email: string): Promise<void> {
  await wisPogingen(await loginSleutel(email));
}

/**
 * Statusopvraag: maximaal 10 pogingen per kwartier per IP-adres. Registreert deze poging.
 * Waarom per IP en niet per e-mailadres? Een aanvaller probeert hier juist veel verschillende
 * referenties en adressen. Op IP beperken we dat, ook als elke poging een ander adres gebruikt.
 */
export async function statusOpvraagToegestaan(ip: string, nu = Date.now()): Promise<boolean> {
  const sleutel = `status:${await sha256Hex(ip)}`;
  const { aantal } = await pogingenSinds(sleutel, nu - 15 * MIN);
  if (aantal >= 10) return false;
  await registreerPoging(sleutel, nu);
  return true;
}
