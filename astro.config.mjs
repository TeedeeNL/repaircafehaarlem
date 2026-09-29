// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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
  vite: {
    plugins: [tailwindcss()],
  },
});
