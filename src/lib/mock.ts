/**
 * Mock-data voor de frontend. Wordt vervangen door Cloudflare D1 in de volgende stap.
 * Veldnamen volgen het ERD uit het technisch ontwerp (sessie, aanmelding, reparatie, vrijwilliger),
 * zodat de formulieren nu al de juiste name-attributen hebben.
 */

export const CATEGORIEEN = [
  'Klein huishoudelijk',
  'Audio en beeld',
  'Computer en telefoon',
  'Textiel',
  'Fiets',
  'Speelgoed en overig',
] as const;
export type Categorie = (typeof CATEGORIEEN)[number];

export type AanmeldingStatus = 'aangemeld' | 'in_behandeling' | 'afgerond' | 'geannuleerd';
export type Uitkomst = 'gerepareerd' | 'deels' | 'niet_gelukt';
export type Rol = 'vrijwilliger' | 'coordinator';

export const AANMELDING_STATUSSEN: { value: AanmeldingStatus; label: string }[] = [
  { value: 'aangemeld', label: 'Aangemeld' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
];

export const UITKOMSTEN: { value: Uitkomst; label: string; lang: string }[] = [
  { value: 'gerepareerd', label: 'Gerepareerd', lang: 'Gerepareerd' },
  { value: 'deels', label: 'Deels', lang: 'Deels gerepareerd' },
  { value: 'niet_gelukt', label: 'Niet gelukt', lang: 'Niet gelukt' },
];

export interface Sessie {
  id: number;
  datum: string; // ISO yyyy-mm-dd
  starttijd: string; // hh:mm
  max_plekken: number;
  status: 'open' | 'gesloten';
}

export interface Aanmelding {
  id: number;
  referentie: string;
  sessie_id: number;
  voornaam: string;
  email: string;
  categorie: Categorie;
  merk_type: string;
  defect: string;
  status: AanmeldingStatus;
}

export interface Reparatie {
  aanmelding_id: number;
  vrijwilliger_id: number;
  uitkomst: Uitkomst;
  notitie: string;
  minuten: number;
}

export interface Vrijwilliger {
  id: number;
  naam: string;
  email: string;
  rol: Rol;
}

/** De mock speelt zich af op de dag van een sessie, zodat werklijst en uitkomsten gevuld zijn. */
export const VANDAAG = '2026-11-07';

export const VRIJWILLIGERS: Vrijwilliger[] = [
  { id: 1, naam: 'Joost', email: 'joost@repaircafehaarlem.nl', rol: 'coordinator' },
  { id: 2, naam: 'Fatima', email: 'fatima@repaircafehaarlem.nl', rol: 'vrijwilliger' },
];

export const SESSIES: Sessie[] = [
  { id: 1, datum: '2026-10-03', starttijd: '10:00', max_plekken: 12, status: 'gesloten' },
  { id: 2, datum: '2026-11-07', starttijd: '10:00', max_plekken: 12, status: 'open' },
  { id: 3, datum: '2026-12-05', starttijd: '10:00', max_plekken: 12, status: 'open' },
  { id: 4, datum: '2027-01-09', starttijd: '10:00', max_plekken: 12, status: 'open' },
];

type Rij = [sessie: number, voornaam: string, categorie: Categorie, merk: string, defect: string, status: AanmeldingStatus];

const RIJEN: Rij[] = [
  // Za 3 oktober (gesloten)
  [1, 'Pieter', 'Klein huishoudelijk', 'Krups XP3440', 'Espressoapparaat lekt en slaat af na een minuut.', 'afgerond'],
  [1, 'Aisha', 'Audio en beeld', 'JBL Flip 5', 'Speaker gaat niet meer aan na het opladen.', 'afgerond'],
  [1, 'Kees', 'Fiets', 'Batavus Fonk', 'Achterrem piept en remt slecht.', 'afgerond'],
  [1, 'Noor', 'Textiel', 'Wollen winterjas', 'Voering is gescheurd bij de mouw.', 'afgerond'],
  // Za 7 november (vandaag): 10 aanmeldingen, 1 geannuleerd, dus 9 van 12 bezet
  [2, 'Daan', 'Klein huishoudelijk', 'Tefal FV1711', 'Strijkijzer wordt niet meer warm.', 'afgerond'],
  [2, 'Joris', 'Fiets', 'Gazelle Chamonix', 'Versnelling slaat over in de derde versnelling.', 'geannuleerd'],
  [2, 'Lotte', 'Klein huishoudelijk', 'Senseo HD7865', 'Lekt water onder het apparaat na het zetten.', 'aangemeld'],
  [2, 'Mehmet', 'Audio en beeld', 'Sony SRS-XB13', 'Speaker laadt niet op, lampje knippert rood.', 'in_behandeling'],
  [2, 'Sanne', 'Klein huishoudelijk', 'Philips HD9650', 'Airfryer gaat niet meer aan, lampje brandt niet. Snoer ziet er goed uit.', 'aangemeld'],
  [2, 'Eva', 'Klein huishoudelijk', 'Bosch TAT3A011', 'Broodrooster springt niet meer omhoog.', 'aangemeld'],
  [2, 'Bram', 'Textiel', 'Spijkerjas', 'Rits is kapot en de trekker is eraf gevallen.', 'aangemeld'],
  [2, 'Fatma', 'Computer en telefoon', 'Lenovo IdeaPad 3', 'Scharnier gebroken, scherm valt naar achteren.', 'afgerond'],
  [2, 'Ruben', 'Audio en beeld', 'Philips AE5250', 'Geen geluid meer, het display werkt wel.', 'afgerond'],
  [2, 'Ilse', 'Speelgoed en overig', 'IKEA Tertial', 'Bureaulamp flikkert en gaat soms uit.', 'aangemeld'],
];

// Za 5 december: vol (12 van 12)
const DEC: [Categorie, string, string][] = [
  ['Klein huishoudelijk', 'Philips HR2100', 'Blender draait niet meer rond.'],
  ['Computer en telefoon', 'Samsung Galaxy A52', 'Oplaadpoort los, laadt alleen in één stand.'],
  ['Fiets', 'Cortina U4', 'Voorlicht werkt niet meer.'],
  ['Textiel', 'Rugzak Eastpak', 'Schouderband is losgescheurd.'],
];
for (let i = 0; i < 12; i++) {
  const [cat, merk, defect] = DEC[i % DEC.length]!;
  RIJEN.push([3, `Bezoeker ${i + 1}`, cat, merk, defect, 'aangemeld']);
}

export const AANMELDINGEN: Aanmelding[] = RIJEN.map(([sessie_id, voornaam, categorie, merk_type, defect, status], i) => ({
  id: i + 1,
  referentie: referentie(i + 1),
  sessie_id,
  voornaam,
  email: `${voornaam.toLowerCase().replace(/\s+/g, '')}@voorbeeld.nl`,
  categorie,
  merk_type,
  defect,
  status,
}));

export const REPARATIES: Reparatie[] = [
  { aanmelding_id: 1, vrijwilliger_id: 1, uitkomst: 'gerepareerd', notitie: 'Snoer vervangen.', minuten: 35 },
  { aanmelding_id: 2, vrijwilliger_id: 2, uitkomst: 'niet_gelukt', notitie: 'Accu defect, niet los te krijgen.', minuten: 25 },
  { aanmelding_id: 3, vrijwilliger_id: 1, uitkomst: 'gerepareerd', notitie: 'Remblokken vervangen.', minuten: 30 },
  { aanmelding_id: 4, vrijwilliger_id: 2, uitkomst: 'deels', notitie: 'Voering genaaid, knoop volgt.', minuten: 45 },
  { aanmelding_id: 5, vrijwilliger_id: 1, uitkomst: 'gerepareerd', notitie: 'Thermostaat schoongemaakt.', minuten: 20 },
  { aanmelding_id: 12, vrijwilliger_id: 2, uitkomst: 'niet_gelukt', notitie: 'Scharnier niet meer leverbaar.', minuten: 40 },
  { aanmelding_id: 13, vrijwilliger_id: 1, uitkomst: 'deels', notitie: 'Schakelaar besteld, volgende sessie terug.', minuten: 20 },
];

export function referentie(n: number, jaar = 2026): string {
  return `RC-${jaar}-${String(n).padStart(4, '0')}`;
}

export function bezet(sessieId: number): number {
  return AANMELDINGEN.filter((a) => a.sessie_id === sessieId && a.status !== 'geannuleerd').length;
}

export function vrijePlekken(s: Sessie): number {
  return Math.max(0, s.max_plekken - bezet(s.id));
}

/** Toekomstige open sessies, oplopend op datum. */
export function komendeSessies(): Sessie[] {
  return SESSIES.filter((s) => s.status === 'open' && s.datum >= VANDAAG).sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Eerstvolgende sessie met vrije plekken, of null. */
export function eerstvolgendeSessie(): Sessie | null {
  return komendeSessies().find((s) => vrijePlekken(s) > 0) ?? null;
}

export function sessieById(id: number): Sessie | undefined {
  return SESSIES.find((s) => s.id === id);
}

export function aanmeldingByRef(ref: string): Aanmelding | undefined {
  return AANMELDINGEN.find((a) => a.referentie === ref);
}

export function reparatieVoor(aanmeldingId: number): Reparatie | undefined {
  return REPARATIES.find((r) => r.aanmelding_id === aanmeldingId);
}

export function aanmeldingenVoorSessie(sessieId: number): Aanmelding[] {
  return AANMELDINGEN.filter((a) => a.sessie_id === sessieId);
}

/** De laatst ingediende aanmelding (voor het bevestigingsscherm). */
export const LAATSTE_AANMELDING = aanmeldingByRef('RC-2026-0009')!;

// Statistiek (F-10): per categorie aantal reparaties en aantal geslaagd (gerepareerd of deels).
export interface StatRij {
  categorie: Categorie;
  aantal: number;
  geslaagd: number;
}
export interface Statistiek {
  sessies: number;
  bijgewerkt_op: string;
  rijen: StatRij[];
}

export const STATISTIEK: Record<'normaal' | 'weinig' | 'geen', Statistiek> = {
  normaal: {
    sessies: 6,
    bijgewerkt_op: '2026-10-04',
    rijen: [
      { categorie: 'Klein huishoudelijk', aantal: 24, geslaagd: 17 },
      { categorie: 'Audio en beeld', aantal: 15, geslaagd: 9 },
      { categorie: 'Computer en telefoon', aantal: 11, geslaagd: 5 },
      { categorie: 'Textiel', aantal: 9, geslaagd: 8 },
      { categorie: 'Fiets', aantal: 6, geslaagd: 5 },
    ],
  },
  weinig: {
    sessies: 3,
    bijgewerkt_op: '2026-10-04',
    rijen: [
      { categorie: 'Klein huishoudelijk', aantal: 10, geslaagd: 7 },
      { categorie: 'Audio en beeld', aantal: 8, geslaagd: 5 },
      { categorie: 'Computer en telefoon', aantal: 6, geslaagd: 3 },
      { categorie: 'Textiel', aantal: 4, geslaagd: 3 },
    ],
  },
  geen: { sessies: 0, bijgewerkt_op: '2026-10-04', rijen: [] },
};

/** Ingelogde gebruiker (mock). Auth volgt met de backend. */
export function huidigeGebruiker(rol: Rol = 'coordinator'): Vrijwilliger {
  return VRIJWILLIGERS.find((v) => v.rol === rol)!;
}
