import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Informatiepagina's (F-11): Markdown in src/content/info/, URL = /info/<bestandsnaam>.
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
  }),
});

export const collections = { info };
