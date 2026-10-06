// Beschrijft de content collection "info": de informatiepagina's (FE-11) als Markdown-bestanden.
// Astro leest dit bij de build en gebruikt pages/info/[slug].astro om van elk bestand een pagina te maken.
// Voordeel: een vrijwilliger kan tekst aanpassen in een .md-bestand zonder code aan te raken.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Informatiepagina's (FE-11): Markdown in src/content/info/, URL = /info/<bestandsnaam>.
// De inhoud staat in de frontmatter (intro, punten, regels, vragen); vrije Markdown in de body kan ook.
// Frontmatter is het blok tussen --- bovenaan een .md-bestand met gegevens als titel en volgorde.
// Het Zod-schema hieronder controleert die gegevens bij de build. Een vergeten titel breekt dus de build,
// en niet pas de live site.
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
