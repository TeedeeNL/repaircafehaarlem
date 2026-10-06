-- Repair Cafe Haarlem: eerste schema (ERD uit het technisch ontwerp, 3NF)
-- plus login_sessie en inlogpoging voor authenticatie en rate limiting.
-- D1 dwingt foreign keys altijd af.
--
-- Een migratie is een genummerd SQL-bestand dat het schema opbouwt. Wrangler voert elk bestand maar
-- één keer uit (npm run db:migrate lokaal, "wrangler d1 migrations apply" in productie).
-- 3NF (derde normaalvorm): elk gegeven staat op één plek. Een sessiedatum staat dus in sessie en niet bij elke aanmelding.
-- Een foreign key (REFERENCES) is een verwijzing naar een rij in een andere tabel. De database weigert
-- een verwijzing naar iets dat niet bestaat.
-- Een CHECK-constraint is een regel die de database zelf afdwingt. De app valideert ook (Zod), maar deze
-- regels blijven gelden, ook als er ooit per ongeluk iets langs de app heen wordt ingevoerd.

-- Tabel vrijwilliger: de accounts van de crew en de coördinator. Zonder deze tabel kan niemand inloggen (FE-05).
-- Het wachtwoord zelf staat hier nooit, alleen de hash en de salt (TE-04).
CREATE TABLE vrijwilliger (
  id              INTEGER PRIMARY KEY,
  naam            TEXT    NOT NULL,
  email           TEXT    NOT NULL,
  wachtwoord_hash TEXT    NOT NULL, -- PBKDF2-SHA256, 100.000 iteraties, hex
  salt            TEXT    NOT NULL, -- 16 willekeurige bytes per gebruiker, hex
  -- De rol bepaalt wie /beheer mag zien (zie src/middleware.ts). Andere waarden worden geweigerd.
  rol             TEXT    NOT NULL CHECK (rol IN ('vrijwilliger', 'coordinator'))
);
-- Index: een extra opzoeklijst waarmee de database een rij snel vindt, zonder de hele tabel te lezen.
-- UNIQUE betekent ook dat twee accounts nooit hetzelfde adres kunnen hebben. De login zoekt hierop (vrijwilligerOpEmail).
CREATE UNIQUE INDEX idx_vrijwilliger_email ON vrijwilliger (email);

-- Tabel sessie: een Repair Cafe-dag waarvoor je je kunt aanmelden. De coördinator maakt ze aan (FE-08).
-- max_plekken is de bovengrens waarmee maakAanmelding vergelijkt (FE-03).
CREATE TABLE sessie (
  id          INTEGER PRIMARY KEY,
  datum       TEXT    NOT NULL CHECK (datum GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  starttijd   TEXT    NOT NULL CHECK (starttijd GLOB '[0-2][0-9]:[0-5][0-9]'),
  max_plekken INTEGER NOT NULL CHECK (max_plekken BETWEEN 1 AND 40),
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'gesloten'))
);
-- Eén sessie per datum (FE-08: dubbele datum is een fout).
-- Deze unieke index zorgt dat dit ook klopt als twee coördinatoren tegelijk dezelfde datum aanmaken.
CREATE UNIQUE INDEX idx_sessie_datum ON sessie (datum);

-- Tabel aanmelding: één rij per apparaat dat een bezoeker wil laten repareren (FE-01).
-- Ze is los van reparatie, want een aanmelding bestaat al voordat er iets gerepareerd is.
CREATE TABLE aanmelding (
  id           INTEGER PRIMARY KEY,
  referentie   TEXT    NOT NULL,
  -- RESTRICT: een sessie met aanmeldingen kan niet worden verwijderd. Zo raken aanmeldingen nooit "zoek".
  sessie_id    INTEGER NOT NULL REFERENCES sessie (id) ON DELETE RESTRICT,
  voornaam     TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  categorie    TEXT    NOT NULL CHECK (categorie IN (
                 'Klein huishoudelijk', 'Audio en beeld', 'Computer en telefoon',
                 'Textiel', 'Fiets', 'Speelgoed en overig')),
  merk_type    TEXT    NOT NULL,
  defect       TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'aangemeld'
                 CHECK (status IN ('aangemeld', 'in_behandeling', 'afgerond', 'geannuleerd')),
  aangemeld_op TEXT    NOT NULL DEFAULT (datetime('now'))
);
-- Het referentienummer is wat de bezoeker bewaart en op /status invult. Het moet uniek zijn en snel te vinden.
CREATE UNIQUE INDEX idx_aanmelding_referentie ON aanmelding (referentie);
-- Bij elke aanmelding tellen we de bezette plekken van één sessie, en de werklijst toont de aanmeldingen van één sessie.
-- Deze index maakt beide opzoekingen snel (zie MET_BEZETTING in src/lib/db/sessie.ts).
CREATE INDEX idx_aanmelding_sessie ON aanmelding (sessie_id);

-- Tabel reparatie: de uitkomst van een reparatie, vastgelegd door een vrijwilliger (FE-07).
-- Een eigen tabel, zodat de aanmelding niet half leeg is zolang er nog niet gerepareerd is.
CREATE TABLE reparatie (
  id              INTEGER PRIMARY KEY,
  -- CASCADE: verdwijnt de aanmelding, dan verdwijnt de reparatie mee. Een reparatie zonder aanmelding heeft geen betekenis.
  aanmelding_id   INTEGER NOT NULL REFERENCES aanmelding (id) ON DELETE CASCADE,
  -- Blijft bewaard voor de statistiek als een vrijwilliger wordt verwijderd.
  -- SET NULL: het veld wordt leeg, de reparatie zelf blijft staan.
  vrijwilliger_id INTEGER REFERENCES vrijwilliger (id) ON DELETE SET NULL,
  uitkomst        TEXT    NOT NULL CHECK (uitkomst IN ('gerepareerd', 'deels', 'niet_gelukt')),
  notitie         TEXT    NOT NULL DEFAULT '' CHECK (length(notitie) <= 300),
  minuten         INTEGER NOT NULL CHECK (minuten BETWEEN 1 AND 480),
  afgerond_op     TEXT    NOT NULL DEFAULT (datetime('now'))
);
-- Hoogstens één reparatie per aanmelding: voorkomt dubbele uitkomsten.
-- Deze index is ook nodig voor de "ON CONFLICT (aanmelding_id)" in slaUitkomstOp (src/lib/db/reparatie.ts).
CREATE UNIQUE INDEX idx_reparatie_aanmelding ON reparatie (aanmelding_id);

-- Tabel login_sessie: wie is er nu ingelogd (FE-05). Elke rij is één sessie van één vrijwilliger.
-- Alleen als de sessie in de database staat, kunnen we hem op elk moment beëindigen (uitloggen, nieuw wachtwoord).
CREATE TABLE login_sessie (
  token           TEXT    PRIMARY KEY, -- SHA-256 van de cookiewaarde, nooit de waarde zelf
  -- CASCADE: wordt een account verwijderd, dan verdwijnen ook zijn sessies.
  vrijwilliger_id INTEGER NOT NULL REFERENCES vrijwilliger (id) ON DELETE CASCADE,
  verloopt_op     INTEGER NOT NULL     -- unix-tijd in seconden
);
-- Bij het aanmaken van een sessie ruimen we verlopen sessies op ("verloopt_op <= nu"). Deze index maakt dat opruimen snel.
-- (Het token zelf is de primaire sleutel en heeft dus al een index voor de zoekopdracht bij elk verzoek.)
CREATE INDEX idx_login_sessie_verloopt ON login_sessie (verloopt_op);

-- Tabel inlogpoging: de teller voor rate limiting (FE-05 inloggen, FE-09 statusopvraag).
-- Ze heet inlogpoging, maar bevat ook statuspogingen. Het onderscheid zit in de sleutel.
CREATE TABLE inlogpoging (
  id       INTEGER PRIMARY KEY,
  sleutel  TEXT    NOT NULL, -- bijv. login:<sha256 e-mail> of status:<sha256 ip>
  tijdstip INTEGER NOT NULL  -- unix-tijd in milliseconden
);
-- We vragen altijd: "hoeveel pogingen heeft deze sleutel sinds dit tijdstip?". Een index op beide kolommen
-- samen beantwoordt dat zonder de hele tabel door te lezen (zie pogingenSinds in src/lib/db/inlogpoging.ts).
CREATE INDEX idx_inlogpoging_sleutel ON inlogpoging (sleutel, tijdstip);
