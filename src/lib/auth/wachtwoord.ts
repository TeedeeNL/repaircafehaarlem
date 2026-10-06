// Wachtwoorden veilig opslaan en controleren (TE-04).
// Gebruikt door de loginpagina, de accountpagina en scripts/hash-wachtwoord.mjs (zelfde parameters).
// Ook sha256Hex staat hier, want sessie.ts en limiet.ts hashen er hun tokens en sleutels mee.
//
// Uitleg van de begrippen:
// - Hash: een eenrichtingsvertaling. Uit "geheim" komt een rij tekens, maar daaruit kun je het
//   wachtwoord niet terugrekenen. In de database staat dus nooit het wachtwoord zelf.
// - Salt: willekeurige extra bytes die per gebruiker verschillen. Twee gebruikers met hetzelfde
//   wachtwoord krijgen daardoor een andere hash, en kant-en-klare hashlijsten (rainbow tables) werken niet.
// - PBKDF2: een hashmethode die het rekenwerk opzettelijk traag maakt door het vele keren te herhalen.
//   Dat remt een aanvaller die miljoenen wachtwoorden probeert te raden.
// TE-04: PBKDF2-SHA256 via Web Crypto, 100.000 iteraties (het maximum in Workers), 16 bytes salt per gebruiker.
// Zelfde parameters als scripts/hash-wachtwoord.mjs.
const ITERATIES = 100_000;
const BITS = 256;

// Hex = bytes als leesbare tekst (0-9, a-f), zodat ze in een tekstkolom in de database passen.
const naarHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const vanHex = (hex: string) => new Uint8Array((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)));

// Rekent wachtwoord + salt om naar een hash. Hier zit het trage PBKDF2-werk.
// crypto.subtle is de ingebouwde cryptografie van de browser en van Workers. Zelf cryptografie
// schrijven is gevaarlijk, dus we gebruiken alleen deze geteste bouwstenen.
async function afleiden(wachtwoord: string, salt: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const sleutel = await crypto.subtle.importKey('raw', new TextEncoder().encode(wachtwoord), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIES }, sleutel, BITS);
}

// Maakt bij een nieuw wachtwoord een verse salt aan en geeft hash en salt terug om op te slaan.
// getRandomValues is een veilige toevalsgenerator. Math.random() is daarvoor niet geschikt.
export async function hashWachtwoord(wachtwoord: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: naarHex(await afleiden(wachtwoord, salt)), salt: naarHex(salt) };
}

/**
 * Vergelijkt in constante tijd.
 * Beveiliging: een gewone === stopt bij het eerste verschil. Aan de duur kan een aanvaller dan
 * afleiden hoeveel tekens kloppen (timing attack). Hier lopen we altijd alle bytes langs.
 */
export async function controleerWachtwoord(wachtwoord: string, saltHex: string, hashHex: string): Promise<boolean> {
  const berekend = new Uint8Array(await afleiden(wachtwoord, vanHex(saltHex)));
  const opgeslagen = vanHex(hashHex);
  if (berekend.byteLength !== opgeslagen.byteLength) return false;
  // XOR (^) geeft 0 als twee bytes gelijk zijn. OR (|=) onthoudt of er ooit een verschil was.
  let verschil = 0;
  for (let i = 0; i < berekend.byteLength; i++) verschil |= berekend[i]! ^ opgeslagen[i]!;
  return verschil === 0;
}

/**
 * Bij een onbekend e-mailadres toch een hash berekenen, zodat de responstijd
 * niet verraadt of het adres bestaat.
 * Beveiliging: zonder dit is "onbekend adres" veel sneller dan "fout wachtwoord", en kan een
 * aanvaller zo uitzoeken welke e-mailadressen een account hebben (user enumeration).
 */
export async function doeAlsofControle(wachtwoord: string): Promise<false> {
  await afleiden(wachtwoord, new Uint8Array(16));
  return false;
}

// SHA-256 is snel en bedoeld voor willekeurige waarden (tokens) en voor het anonimiseren van sleutels.
// Voor wachtwoorden is het te snel, daarom gebruiken we daar PBKDF2.
export async function sha256Hex(tekst: string): Promise<string> {
  return naarHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst)));
}
