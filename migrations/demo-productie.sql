-- Demodata voor de live versie (schoolproject). Valt buiten migrations_pattern: draait nooit automatisch.
-- Uitvoeren met: npx wrangler d1 execute DB --remote --file=migrations/demo-productie.sql
-- Raakt geen accounts aan. Veilig om opnieuw te draaien: sessies en aanmeldingen worden niet dubbel gemaakt.

-- Oude testsessies weg, alleen als er geen aanmeldingen aan hangen.
DELETE FROM sessie
WHERE datum IN ('2026-09-30', '2026-10-15')
  AND NOT EXISTS (SELECT 1 FROM aanmelding a WHERE a.sessie_id = sessie.id);

-- Elke eerste zaterdag, 10:00, 12 plekken.
INSERT INTO sessie (datum, starttijd, max_plekken, status) VALUES
  ('2026-11-07', '10:00', 12, 'open'),
  ('2026-12-05', '10:00', 12, 'open'),
  ('2027-01-02', '10:00', 12, 'open')
ON CONFLICT (datum) DO NOTHING;

-- Fictieve aanmeldingen: 9 op 7 november (3 plekken vrij) en 12 op 5 december (vol).
-- Referenties lopen door vanaf het hoogste bestaande nummer van 2026.
WITH demo (n, datum, voornaam, categorie, merk_type, defect) AS (
  VALUES
    (1, '2026-11-07', 'Daan', 'Klein huishoudelijk', 'Tefal FV1711', 'Strijkijzer wordt niet meer warm.'),
    (2, '2026-11-07', 'Lotte', 'Klein huishoudelijk', 'Senseo HD7865', 'Lekt water onder het apparaat na het zetten.'),
    (3, '2026-11-07', 'Mehmet', 'Audio en beeld', 'Sony SRS-XB13', 'Speaker laadt niet op, lampje knippert rood.'),
    (4, '2026-11-07', 'Sanne', 'Klein huishoudelijk', 'Philips HD9650', 'Airfryer gaat niet meer aan, lampje brandt niet.'),
    (5, '2026-11-07', 'Eva', 'Klein huishoudelijk', 'Bosch TAT3A011', 'Broodrooster springt niet meer omhoog.'),
    (6, '2026-11-07', 'Bram', 'Textiel', 'Spijkerjas', 'Rits is kapot en de trekker is eraf gevallen.'),
    (7, '2026-11-07', 'Fatma', 'Computer en telefoon', 'Lenovo IdeaPad 3', 'Scharnier gebroken, scherm valt naar achteren.'),
    (8, '2026-11-07', 'Ruben', 'Audio en beeld', 'Philips AE5250', 'Geen geluid meer, het display werkt wel.'),
    (9, '2026-11-07', 'Ilse', 'Speelgoed en overig', 'IKEA Tertial', 'Bureaulamp flikkert en gaat soms uit.'),
    (10, '2026-12-05', 'Pieter', 'Klein huishoudelijk', 'Philips HR2100', 'Blender draait niet meer rond.'),
    (11, '2026-12-05', 'Aisha', 'Computer en telefoon', 'Samsung Galaxy A52', 'Oplaadpoort los, laadt alleen in één stand.'),
    (12, '2026-12-05', 'Kees', 'Fiets', 'Cortina U4', 'Voorlicht werkt niet meer na de regen.'),
    (13, '2026-12-05', 'Noor', 'Textiel', 'Rugzak Eastpak', 'Schouderband is losgescheurd bij de naad.'),
    (14, '2026-12-05', 'Joris', 'Fiets', 'Gazelle Chamonix', 'Versnelling slaat over in de derde versnelling.'),
    (15, '2026-12-05', 'Mila', 'Klein huishoudelijk', 'Krups XP3440', 'Espressoapparaat lekt en slaat af na een minuut.'),
    (16, '2026-12-05', 'Sem', 'Audio en beeld', 'JBL Flip 5', 'Speaker gaat niet meer aan na het opladen.'),
    (17, '2026-12-05', 'Yara', 'Textiel', 'Wollen winterjas', 'Voering is gescheurd bij de mouw.'),
    (18, '2026-12-05', 'Luuk', 'Speelgoed en overig', 'Houten treinbaan', 'Wissel breekt steeds los van de rails.'),
    (19, '2026-12-05', 'Fenna', 'Klein huishoudelijk', 'Braun TexStyle 7', 'Stoomfunctie doet het niet meer.'),
    (20, '2026-12-05', 'Omar', 'Computer en telefoon', 'HP DeskJet 2720', 'Printer trekt het papier scheef in.'),
    (21, '2026-12-05', 'Isa', 'Fiets', 'Batavus Fonk', 'Achterrem piept en remt slecht.')
),
basis AS (
  SELECT COALESCE(MAX(CAST(substr(referentie, 9) AS INTEGER)), 0) AS hoogste
  FROM aanmelding WHERE referentie LIKE 'RC-2026-%'
)
INSERT INTO aanmelding (referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status)
SELECT
  printf('RC-2026-%04d', basis.hoogste + demo.n),
  s.id,
  demo.voornaam,
  lower(demo.voornaam) || '.demo@voorbeeld.nl',
  demo.categorie,
  demo.merk_type,
  demo.defect,
  'aangemeld'
FROM demo
JOIN sessie s ON s.datum = demo.datum
CROSS JOIN basis
WHERE NOT EXISTS (SELECT 1 FROM aanmelding a WHERE a.sessie_id = s.id)
ORDER BY demo.n;
