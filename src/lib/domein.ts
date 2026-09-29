// Vaste lijsten en typen uit het gegevensontwerp. Gelijk aan de CHECK-constraints in migrations/0001_init.sql.

export const CATEGORIEEN = [
  'Klein huishoudelijk',
  'Audio en beeld',
  'Computer en telefoon',
  'Textiel',
  'Fiets',
  'Speelgoed en overig',
] as const;
export type Categorie = (typeof CATEGORIEEN)[number];

export const AANMELDING_STATUSSEN = [
  { value: 'aangemeld', label: 'Aangemeld' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'afgerond', label: 'Afgerond' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
] as const;
export type AanmeldingStatus = (typeof AANMELDING_STATUSSEN)[number]['value'];

export const UITKOMSTEN = [
  { value: 'gerepareerd', label: 'Gerepareerd' },
  { value: 'deels', label: 'Deels' },
  { value: 'niet_gelukt', label: 'Niet gelukt' },
] as const;
export type Uitkomst = (typeof UITKOMSTEN)[number]['value'];

export type Rol = 'vrijwilliger' | 'coordinator';

export interface Gebruiker {
  id: number;
  naam: string;
  email: string;
  rol: Rol;
}
