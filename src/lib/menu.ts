import { getCollection } from 'astro:content';

export interface MenuItem {
  label: string;
  /** Kortere naam voor het desktopmenu. */
  kort: string;
  href: string;
  samenvatting?: string;
}

/** Informatiepagina's met in_menu: true, gesorteerd op volgorde. */
export async function infoPaginas(): Promise<MenuItem[]> {
  const paginas = await getCollection('info', ({ data }) => data.in_menu);
  return paginas
    .sort((a, b) => a.data.volgorde - b.data.volgorde)
    .map((p) => ({
      label: p.data.titel,
      kort: p.data.menutitel ?? p.data.titel,
      href: `/info/${p.id}`,
      samenvatting: p.data.samenvatting,
    }));
}

/** Hoofdmenu: informatiepagina's uit de collection plus de vaste publieke pagina's. */
export async function hoofdmenu(): Promise<MenuItem[]> {
  return [
    ...(await infoPaginas()),
    { label: 'Statistieken', kort: 'Statistieken', href: '/statistiek' },
    { label: 'Status opvragen', kort: 'Status opvragen', href: '/status' },
  ];
}
