import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Informatiepagina's (F-11): Markdown in src/content/info/, URL = /info/<bestandsnaam>.
// De inhoud staat in de frontmatter (intro, punten, regels, vragen); vrije Markdown in de body kan ook.
const info = defineCollection({
  loader: glob({ base: './src/content/info', pattern: '**/*.md' }),
  schema: z.object({
    titel: z.string().min(1),
    volgorde: z.number().int(),
    in_menu: z.boolean().default(true),
    /** Korte omschrijving voor de kaart op de homepage. */
    samenvatting: z.string().optional(),
    /** Kortere naam in het desktopmenu, bijvoorbeeld "Vragen". */
    menutitel: z.string().optional(),
    /** Openingszin onder de paginakop. */
    intro: z.string().optional(),
    /** Kaarten met een titel en tekst (bijv. Over ons). */
    punten: z.array(z.object({ titel: z.string().min(1), tekst: z.string().min(1) })).optional(),
    /** Genummerde regels (bijv. Huisregels). */
    regels: z.array(z.string().min(1)).optional(),
    /** Vragen en antwoorden, getoond als uitklapbare lijst. */
    vragen: z.array(z.object({ vraag: z.string().min(1), antwoord: z.string().min(1) })).optional(),
  }),
});

export const collections = { info };
