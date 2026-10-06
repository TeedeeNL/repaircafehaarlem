// @ts-check
// Hoofdinstellingen van Astro: welke host de site draait (Cloudflare), hoe sessies, bestandsnamen en fonts werken.
// Astro leest dit bestand bij elke build en bij npm run dev. Het gaat hier niet om pagina-inhoud.
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Adapter: de "vertaler" die Astro-code omzet naar iets dat op Cloudflare Workers draait.
  // Pagina's met prerender = false worden daardoor server-side uitgevoerd op de Worker (SSR).
  // Afbeeldingen worden tijdens de build geoptimaliseerd; geen Images-binding nodig.
  adapter: cloudflare({ imageService: 'compile' }),
  // Sessies (KV) komen pas met de backend; nu uit zodat er geen KV-binding nodig is.
  // Let op: dit is Astro's eigen sessiefunctie. Onze login gebruikt die niet. Wij bewaren sessies zelf in D1
  // (tabel login_sessie), zodat we ze kunnen beëindigen en alleen de hash van het token opslaan (FE-05).
  session: false,
  // /info/huisregels als huisregels.html, zodat de links zonder slash geen extra redirect geven.
  build: { format: 'file' },
  // Fonts worden tijdens de build gedownload en zelf gehost; Astro maakt passende fallbacks (geen layout shift).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-rc-display',
      weights: [500, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Atkinson Hyperlegible',
      cssVariable: '--font-rc-tekst',
      weights: [400, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-rc-mono',
      weights: [500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
  // Vite is de bouwtool onder Astro. Tailwind (de opmaaktaal met klassen) werkt als Vite-plugin.
  vite: {
    plugins: [tailwindcss()],
  },
});
