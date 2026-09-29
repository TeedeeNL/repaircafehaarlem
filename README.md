# Repair Cafe Haarlem

Frontend van de aanmeld- en reparatie-app (Astro + Tailwind, Cloudflare Workers). Backend en database volgen; alle schermen draaien nu op mock-data uit `src/lib/mock.ts`.

## Commando's

| Commando          | Wat                                            |
| :---------------- | :--------------------------------------------- |
| `npm install`     | Afhankelijkheden installeren                   |
| `npm run dev`     | Dev-server op `localhost:4321`                 |
| `npm run build`   | Productiebuild naar `./dist/`                  |
| `npm run check`   | Typecontrole (`astro check`)                   |

## States bekijken (alleen in dev)

Elke pagina toont de states uit het ontwerp via `?state=<naam>`, bijvoorbeeld `/aanmelden?state=fouten`. Rechtsonder staat in dev een menu "States (dev)" met alle states van de huidige pagina.

## Informatiepagina's

Markdown in `src/content/info/` met frontmatter `titel`, `volgorde` en `in_menu` (optioneel `samenvatting` en `menutitel`). Elke pagina verschijnt op `/info/<bestandsnaam>` en, bij `in_menu: true`, automatisch in het menu.

## Design tokens

Kleuren, fonts, radius, hoogtes en schaduwen staan in `tailwind.config.mjs`. Componenten gebruiken alleen die namen, geen hex-waarden.
