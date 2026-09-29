// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Afbeeldingen worden tijdens de build geoptimaliseerd; geen Images-binding nodig.
  adapter: cloudflare({ imageService: 'compile' }),
  // Sessies (KV) komen pas met de backend; nu uit zodat er geen KV-binding nodig is.
  session: false,
  // /info/huisregels als huisregels.html, zodat de links zonder slash geen extra redirect geven.
  build: { format: 'file' },
  vite: {
    plugins: [tailwindcss()],
  },
});
