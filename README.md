# Repair Cafe Haarlem

Aanmeld- en reparatie-app: Astro 7 + Tailwind 4 op Cloudflare Workers, met Cloudflare D1 als database.

## Lokaal starten

```sh
npm install
cp .dev.vars.example .dev.vars   # Turnstile-testsleutel en MAIL_MODUS=console
npm run db:reset                 # migraties + testdata in de lokale D1 (.wrangler/)
npm run dev                      # http://localhost:4321
```

Testaccounts (alleen lokaal, uit `migrations/seed.sql`), wachtwoord `reparatie`:

- `joost@repaircafehaarlem.nl` (coördinator)
- `fatima@repaircafehaarlem.nl` (vrijwilliger)

Statusopvraag proberen: `RC-2026-0009` met `sanne@voorbeeld.nl`.

## Commando's

| Commando             | Wat                                                              |
| :------------------- | :--------------------------------------------------------------- |
| `npm run dev`        | Dev-server met lokale D1 en bindings                              |
| `npm run build`      | Productiebuild naar `./dist/` (leest D1 voor `/statistiek`)       |
| `npm run check`      | Typecontrole (`astro check`)                                      |
| `npm run db:migrate` | Migraties uit `migrations/0001_*.sql` op de lokale D1             |
| `npm run db:seed`    | Testdata laden (wist eerst alle tabellen)                         |
| `npm run db:reset`   | Beide                                                             |
| `npm run hash -- <w>`| Salt en hash maken voor een nieuw vrijwilligersaccount            |

## Opbouw

- `migrations/` schema (`0001_init.sql`) en testdata (`seed.sql`, valt buiten het migratiepatroon)
- `src/lib/db/` alle SQL, een module per tabel, altijd prepared statements met `.bind()`
- `src/lib/schemas/` Zod-schema per formulier, fouten als `{ veld: melding }`
- `src/lib/auth/` PBKDF2-wachtwoorden, sessiecookie en rate limiting
- `src/middleware.ts` beschermt `/crew` en `/beheer` (302 naar login, 403 zonder coördinatorrol)
- `src/lib/mail/` mailer-interface: `console` (dev) of `uit` (geen provider; aanmelding blijft staan)
- `src/content/info/` informatiepagina's in Markdown (`titel`, `volgorde`, `in_menu`)
- `tailwind.config.mjs` alle design tokens

## Naar productie

1. `npx wrangler d1 create repair-cafe` en het `database_id` in `wrangler.toml` invullen.
2. `npx wrangler d1 migrations apply DB --remote` (nooit `seed.sql` op productie).
3. Echte Turnstile-sleutels: `TURNSTILE_SITE_KEY` in `wrangler.toml` en `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. Accounts aanmaken met `npm run hash -- <wachtwoord>` en een `INSERT INTO vrijwilliger` via `wrangler d1 execute DB --remote`.
5. Mail: er is nog geen provider gekoppeld. Met `MAIL_MODUS = "uit"` toont S3 "de mail volgt later".
6. `/statistiek` wordt tijdens de build uit D1 gevuld. Lokaal is dat de database in `.wrangler/`; laat de productiebuild de remote database lezen (bijvoorbeeld `remote = true` op de D1-binding tijdens de build), anders klopt de pagina niet of stopt de build.
