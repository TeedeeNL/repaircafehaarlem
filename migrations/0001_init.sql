-- Repair Cafe Haarlem: eerste schema (ERD uit het technisch ontwerp, 3NF)
-- plus login_sessie en inlogpoging voor authenticatie en rate limiting.
-- D1 dwingt foreign keys altijd af.

CREATE TABLE vrijwilliger (
  id              INTEGER PRIMARY KEY,
  naam            TEXT    NOT NULL,
  email           TEXT    NOT NULL,
  wachtwoord_hash TEXT    NOT NULL, -- PBKDF2-SHA256, 100.000 iteraties, hex
  salt            TEXT    NOT NULL, -- 16 willekeurige bytes per gebruiker, hex
  rol             TEXT    NOT NULL CHECK (rol IN ('vrijwilliger', 'coordinator'))
);
CREATE UNIQUE INDEX idx_vrijwilliger_email ON vrijwilliger (email);

CREATE TABLE sessie (
  id          INTEGER PRIMARY KEY,
  datum       TEXT    NOT NULL CHECK (datum GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  starttijd   TEXT    NOT NULL CHECK (starttijd GLOB '[0-2][0-9]:[0-5][0-9]'),
  max_plekken INTEGER NOT NULL CHECK (max_plekken BETWEEN 1 AND 40),
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'gesloten'))
);
-- Eén sessie per datum (F-08: dubbele datum is een fout).
CREATE UNIQUE INDEX idx_sessie_datum ON sessie (datum);

CREATE TABLE aanmelding (
  id           INTEGER PRIMARY KEY,
  referentie   TEXT    NOT NULL,
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
CREATE UNIQUE INDEX idx_aanmelding_referentie ON aanmelding (referentie);
CREATE INDEX idx_aanmelding_sessie ON aanmelding (sessie_id);

CREATE TABLE reparatie (
  id              INTEGER PRIMARY KEY,
  aanmelding_id   INTEGER NOT NULL REFERENCES aanmelding (id) ON DELETE CASCADE,
  -- Blijft bewaard voor de statistiek als een vrijwilliger wordt verwijderd.
  vrijwilliger_id INTEGER REFERENCES vrijwilliger (id) ON DELETE SET NULL,
  uitkomst        TEXT    NOT NULL CHECK (uitkomst IN ('gerepareerd', 'deels', 'niet_gelukt')),
  notitie         TEXT    NOT NULL DEFAULT '' CHECK (length(notitie) <= 300),
  minuten         INTEGER NOT NULL CHECK (minuten BETWEEN 1 AND 480),
  afgerond_op     TEXT    NOT NULL DEFAULT (datetime('now'))
);
-- Hoogstens één reparatie per aanmelding: voorkomt dubbele uitkomsten.
CREATE UNIQUE INDEX idx_reparatie_aanmelding ON reparatie (aanmelding_id);

CREATE TABLE login_sessie (
  token           TEXT    PRIMARY KEY, -- SHA-256 van de cookiewaarde, nooit de waarde zelf
  vrijwilliger_id INTEGER NOT NULL REFERENCES vrijwilliger (id) ON DELETE CASCADE,
  verloopt_op     INTEGER NOT NULL     -- unix-tijd in seconden
);
CREATE INDEX idx_login_sessie_verloopt ON login_sessie (verloopt_op);

CREATE TABLE inlogpoging (
  id       INTEGER PRIMARY KEY,
  sleutel  TEXT    NOT NULL, -- bijv. login:<sha256 e-mail> of status:<sha256 ip>
  tijdstip INTEGER NOT NULL  -- unix-tijd in milliseconden
);
CREATE INDEX idx_inlogpoging_sleutel ON inlogpoging (sleutel, tijdstip);
