/**
 * Dev-hulp: toon een scherm-state uit de export via ?state=<naam>.
 * Alleen actief in de dev-server; in de build (en op prerendered pagina's) altijd de standaard-state.
 */
export const STATES_AAN = import.meta.env.DEV;

export interface StateOptie<T extends string> {
  key: T;
  label: string;
}

export function leesState<T extends string>(url: URL, opties: readonly StateOptie<T>[]): T | null {
  if (!STATES_AAN) return null;
  const waarde = url.searchParams.get('state');
  return opties.find((o) => o.key === waarde)?.key ?? null;
}
