# Uitleg van de Repair Cafe-app

Dit document helpt je de code uit te leggen aan een docent. Het hoort bij het commentaar in de code. Lees eerst deze tekst, open daarna de genoemde bestanden.

**Let op, controleer dit voor je het inlevert.** Ik had je ontwerpdocument niet bij de hand. Wat ik zeker weet, staat in de code zelf: FE-01 t/m FE-11 (functionele eisen), TE-03, TE-04 en TE-05, en K7. Bij de andere TE-nummers (TE-01, TE-02, TE-06) is de omschrijving een aanname. Die staan hieronder gemarkeerd met "(aanname)". Pas ze aan als je ontwerp iets anders zegt.

## 1. In 10 zinnen hoe de app werkt

1. Een bezoeker opent de site, die draait als Worker op Cloudflare. Astro maakt de pagina's.
2. De homepage en de infopagina's zijn vooraf gebouwd als vaste HTML (prerender). Ze laden snel en hebben geen database nodig.
3. Pagina's met wisselende gegevens, zoals het aanmeldformulier, draaien bij elk verzoek op de server (SSR).
4. Bij elk verzoek draait eerst `src/middleware.ts`. Die laat `/crew` en `/beheer` alleen door met een geldige sessie.
5. Een formulier wordt op de server gecontroleerd met een Zod-schema. De controle in de browser is alleen gemak.
6. Bij het aanmelden controleert Cloudflare Turnstile of de bezoeker geen bot is.
7. Alle gegevens staan in Cloudflare D1 (een SQL-database). Alle queries staan in `src/lib/db/` en gebruiken prepared statements.
8. De plekcontrole en het opslaan van een aanmelding zijn één SQL-statement. Zo kan een sessie niet overboekt raken.
9. Daarna gaat er een bevestigingsmail uit via EUSEND. Mislukt de mail, dan blijft de aanmelding gewoon staan.
10. Vrijwilligers loggen in met een wachtwoord (PBKDF2-hash) en krijgen een cookie. Ze zien de werklijst en leggen uitkomsten vast. De coördinator beheert ook de sessies.

## 2. De route van één aanmelding

Een bezoeker meldt een apparaat aan. Dit zijn de bestanden, in volgorde.

**Formulier tonen (GET /aanmelden)**

1. `src/middleware.ts`: de route is niet beschermd, dus het verzoek gaat meteen door.
2. `src/pages/aanmelden/index.astro`: draait op de server. Het haalt de sessies op en toont het formulier.
3. `src/lib/db/sessie.ts` (`komendeSessies`): leest uit de tabel `sessie`, met het aantal bezette plekken.
4. `src/lib/turnstile.ts` (`turnstileSiteKey`): geeft de publieke sleutel voor de widget.

**Formulier verzenden (POST /aanmelden)**

5. `src/middleware.ts`: weer doorlaten.
6. `src/pages/aanmelden/index.astro`: leest het formulier.
7. `src/lib/schemas/formulier.ts` (`leesFormulier`, `valideer`) met `src/lib/schemas/aanmelding.ts`: controleert en maakt de invoer schoon.
8. `src/lib/turnstile.ts` (`verifieerTurnstile`): vraagt bij Cloudflare of het token echt is. Dit gebeurt tegelijk met stap 7.
9. `src/lib/db/aanmelding.ts` (`maakAanmelding`): controleert de plek en voegt de aanmelding toe in één statement.
10. `src/lib/db/client.ts` (`db()`): geeft toegang tot D1. De tabellen komen uit `migrations/0001_init.sql`.
11. `src/lib/db/sessie.ts` (`komendeSessies`): haalt de datum en tijd op voor de mail.
12. `src/lib/mail/bevestiging.ts` en `src/lib/mail/index.ts`: maken en versturen de mail.
13. `src/lib/bevestiging.ts` (`onthoudBevestiging`): zet een korte cookie met de referentie.
14. Redirect (303) naar `/aanmelden/bevestiging`.

**Bevestiging tonen (GET /aanmelden/bevestiging)**

15. `src/pages/aanmelden/bevestiging.astro`: leest de cookie via `leesBevestiging` en haalt de aanmelding op met `aanmeldingVoorOpvraag` (`src/lib/db/aanmelding.ts`).

## 3. Hoe inloggen werkt, stap voor stap

1. De vrijwilliger opent bijvoorbeeld `/crew`. De middleware ziet geen geldige sessie en stuurt door naar `/login?terug=/crew` (302).
2. `src/pages/login.astro` toont het formulier. De terug-link wordt gecontroleerd (`veiligDoel`), zodat het nooit naar een externe site wijst.
3. Bij een POST valideert `loginSchema` (`src/lib/schemas/login.ts`) alleen of de velden zijn ingevuld.
4. `loginBlokkade` (`src/lib/auth/limiet.ts`) kijkt of dit account geblokkeerd is. Zo ja, dan stopt het hier (429).
5. `vrijwilligerOpEmail` (`src/lib/db/vrijwilliger.ts`) zoekt het account met zijn salt en hash.
6. `controleerWachtwoord` (`src/lib/auth/wachtwoord.ts`) rekent PBKDF2 uit met de salt en vergelijkt in constante tijd. Bij een onbekend adres rekent `doeAlsofControle` toch een hash uit, zodat de tijd niets verraadt.
7. Bij een fout: `registreerMislukteLogin` telt de poging. Bij 5 pogingen in 10 minuten volgt een blokkade van 15 minuten. De melding is altijd dezelfde.
8. Bij succes: `wisMislukteLogins` zet de teller terug en `startSessie` (`src/lib/auth/sessie.ts`) maakt een willekeurig token van 32 bytes.
9. De SHA-256 van dat token gaat naar de tabel `login_sessie` (`src/lib/db/login-sessie.ts`). Het token zelf gaat als cookie naar de browser (HttpOnly, Secure, SameSite=Lax, 8 uur).
10. Redirect (303) naar de pagina waar de vrijwilliger heen wilde.
11. Bij elk volgend verzoek leest de middleware het cookie, hasht het token en zoekt de sessie op (`huidigeGebruiker`, `gebruikerBijToken`). De gebruiker komt in `Astro.locals.gebruiker`.
12. Voor `/beheer` controleert de middleware ook de rol. Een vrijwilliger krijgt een 403.
13. Uitloggen gaat via een POST naar `/uitloggen` (`src/pages/uitloggen.ts`). Dat verwijdert de sessie uit de database en het cookie uit de browser.

## 4. Per technische eis: waar zit het in de code

| Eis | Waar | Bestand en functie |
| :-- | :-- | :-- |
| TE-01 (aanname): Astro met server-side rendering op Cloudflare Workers | Adapter en Worker-instellingen | `astro.config.mjs` (`adapter: cloudflare`), `wrangler.toml`, `export const prerender = false` in de pagina's |
| TE-02 (aanname): D1-database, alleen prepared statements | Alle SQL op één plek | `src/lib/db/client.ts` (`db`), alle bestanden in `src/lib/db/`, schema in `migrations/0001_init.sql` |
| TE-03 (aanname: validatie op de server met Zod) | Schema's en hulpfuncties | `src/lib/schemas/*.ts`, vooral `formulier.ts` (`leesFormulier`, `valideer`) en `aanmelding.ts` (`aanmeldingSchema`). Gebruikt in `src/pages/aanmelden/index.astro` |
| TE-04: PBKDF2-SHA256, 100.000 iteraties, 16 bytes salt | Wachtwoorden | `src/lib/auth/wachtwoord.ts` (`hashWachtwoord`, `controleerWachtwoord`). Zelfde parameters in `scripts/hash-wachtwoord.mjs` |
| TE-05: Turnstile, controle op de server | Bot-controle bij aanmelden | `src/lib/turnstile.ts` (`verifieerTurnstile`), aangeroepen in `src/pages/aanmelden/index.astro` |
| TE-06 (aanname: sessies, toegangscontrole en rate limiting) | Inlogcontrole en limieten | `src/middleware.ts` (`onRequest`), `src/lib/auth/sessie.ts`, `src/lib/auth/limiet.ts` |

Ook relevant: K7 (statistiek statisch) is bewust anders gedaan. `src/pages/statistiek.astro` leest per verzoek uit D1, omdat de build op Cloudflare de productiedatabase niet kan bereiken. Dat staat in het commentaar bovenaan die pagina en in `README.md`.

## 5. Tien vragen die een docent waarschijnlijk stelt

**1. Waarom controleert u het formulier op de server, als de browser dat al doet?**
De browser is van de bezoeker. Iemand kan de controle uitzetten of zelf een verzoek sturen. Daarom beslist de server altijd, met een Zod-schema. De controle in de browser is alleen handig voor de gebruiker.

**2. Hoe voorkomt u SQL-injectie?**
Ik gebruik alleen prepared statements. De SQL staat vast en de waarden gaan apart mee met `.bind()`. De database leest een waarde dus nooit als code. Alle SQL staat in `src/lib/db/`.

**3. Wat gebeurt er als twee mensen tegelijk de laatste plek boeken?**
Ik tel niet eerst en voeg daarna toe. De telling zit in dezelfde `INSERT` (`maakAanmelding`). De database doet beide in één keer, dus de tweede persoon krijgt "sessie is vol" en er komen nooit meer aanmeldingen dan plekken.

**4. Hoe slaat u wachtwoorden op?**
Nooit leesbaar. Ik gebruik PBKDF2 met SHA-256, 100.000 herhalingen en een eigen willekeurige salt per gebruiker. In de database staan alleen de hash en de salt. Door de salt krijgen twee gelijke wachtwoorden een andere hash.

**5. Waarom zijn het 100.000 iteraties en niet meer?**
Dat is het maximum dat Cloudflare Workers toestaat. Meer iteraties maken raden trager, maar dit is de grens van het platform.

**6. Wat staat er in het sessiecookie?**
Een willekeurig token van 32 bytes, geen gegevens over de gebruiker. In de database bewaar ik alleen de SHA-256 van dat token. Lekt de database, dan kan niemand met die waarden inloggen. Het cookie is HttpOnly (JavaScript kan het niet lezen), Secure (alleen https) en SameSite=Lax (helpt tegen CSRF).

**7. Hoe beschermt u de beheerpagina's?**
In de middleware, dus voor elke pagina en voor elke methode, ook een directe POST. Geen sessie geeft een redirect naar de login (302). Een vrijwilliger zonder coördinatorrol krijgt een 403 en de pagina draait dan niet eens.

**8. Hoe houdt u brute force (eindeloos wachtwoorden proberen) tegen?**
Met rate limiting. Na 5 mislukte pogingen in 10 minuten is het account 15 minuten geblokkeerd. De teller staat in D1 (tabel `inlogpoging`) onder een hash van het e-mailadres, dus zonder persoonsgegevens. De statusopvraag heeft een eigen limiet: 10 pogingen per kwartier per IP-adres.

**9. Waarom krijgt een aanvaller niet te zien of een e-mailadres bestaat?**
Bij een fout wachtwoord en bij een onbekend adres is de melding hetzelfde. Ook de tijd is gelijk, omdat ik bij een onbekend adres toch een hash laat uitrekenen (`doeAlsofControle`). Bij de statusopvraag geldt hetzelfde: elke niet-kloppende combinatie geeft "niet gevonden".

**10. Waarom is de statistiekpagina niet statisch, terwijl uw ontwerp (K7) dat vraagt?**
Een statische pagina wordt bij de build gemaakt. De build op Cloudflare kan niet bij de productiedatabase, dus er zouden geen echte cijfers in komen. Daarom wordt de pagina per verzoek uit D1 gelezen en een uur gecachet (`s-maxage=3600`). Dat is een bewuste afwijking, en ze staat in de code en in de README.

## 6. Wat u eerlijk kunt zeggen over de grenzen

- Er is geen apart CSRF-token. Ik leun op SameSite=Lax. Astro controleert daarnaast standaard de `Origin` van formulier-POSTs (ik heb dat niet uitgezet). Controleer dit in de Astro-documentatie als de docent hierop doorvraagt.
- Het e-mailadres in een aanmelding wordt niet geverifieerd voor de mail verstuurd wordt. De statusopvraag is daarom beveiligd met referentie plus e-mailadres en een limiet, niet met een account.
- Rate limiting op IP-adres kan eerlijke bezoekers achter hetzelfde netwerk raken. Voor deze schaal is dat een bewuste afweging.
