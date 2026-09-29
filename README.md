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
| `npm run build`      | Productiebuild naar `./dist/` (heeft geen database nodig)         |
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
- `src/lib/mail/` mailer-interface: `eusend` (productie), `console` (dev) of `uit`; een mislukte mail laat de aanmelding staan
- `src/content/info/` informatiepagina's in Markdown (`titel`, `volgorde`, `in_menu`)
- `tailwind.config.mjs` alle design tokens

## Naar productie

1. Productie-D1 `repair-cafe` (EU-jurisdictie) staat al in `wrangler.toml`; de Worker heet `repaircafehaarlem` en wordt bij elke push naar `master` gebouwd door Cloudflare Workers Builds.
2. `npx wrangler d1 migrations apply DB --remote` (nooit `seed.sql` op productie).
3. Echte Turnstile-sleutels: `TURNSTILE_SITE_KEY` in `wrangler.toml` en `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. Accounts aanmaken: `npm run account -- --naam "Naam" --email adres@voorbeeld.nl --rol coordinator --remote`. Het wachtwoord (minimaal 12 tekens) wordt verborgen gevraagd; alleen hash en salt gaan naar D1.
5. Mail via [EUSEND](https://eusend.dev) (verwerking en opslag in de EU). De site draait op `repaircafehaarlem.timduinker10.workers.dev` zonder eigen domein; mail gaat vanaf het subdomein `repaircafe.timwebsites.nl` (afzender in `MAIL_AFZENDER`). Dat subdomein moet in EUSEND geverifieerd zijn (DKIM-, DMARC-, SPF- en MX-record in Cloudflare-DNS van timwebsites.nl). Sleutel: `npx wrangler secret put EUSEND_API_KEY`. Weigert EUSEND de mail, dan blijft de aanmelding staan, toont S3 "de mail volgt later" en staat de reden (zonder e-mailadres) in de Worker-log.
6. `/statistiek` wordt per verzoek uit D1 gelezen (`Cache-Control: s-maxage=3600`). Dat wijkt af van ontwerpkeuze K7 (statisch), omdat de build op Cloudflare geen toegang heeft tot de productiedatabase.
