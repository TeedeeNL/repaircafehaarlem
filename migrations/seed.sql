-- Testdata voor lokale ontwikkeling. Sessies op de eerste zaterdag van de maand, 10:00, 12 plekken:
-- 3 okt gesloten, 7 nov open met 3 plekken vrij, 5 dec vol, 2 jan open en leeg.
-- NIET op productie uitvoeren. Uitvoeren met: npm run db:seed
-- Beide testaccounts hebben het wachtwoord 'reparatie'.

DELETE FROM login_sessie;
DELETE FROM inlogpoging;
DELETE FROM reparatie;
DELETE FROM aanmelding;
DELETE FROM sessie;
DELETE FROM vrijwilliger;

INSERT INTO vrijwilliger (id, naam, email, wachtwoord_hash, salt, rol) VALUES (1, 'Joost', 'joost@repaircafehaarlem.nl', '32dfc5b3ad55e05ee973fcc3f0c55898408a82eb2bc58a7004246fd47b813bbf', '977aeab59859a63493b6bd59d7f896ff', 'coordinator');
INSERT INTO vrijwilliger (id, naam, email, wachtwoord_hash, salt, rol) VALUES (2, 'Fatima', 'fatima@repaircafehaarlem.nl', '9b1cc88fee5d2cc755530017b5fe76f79a3da9e6784f26c7f489077b45c71c4b', '9b199935772ab954b53f39f4af2930e4', 'vrijwilliger');

INSERT INTO sessie (id, datum, starttijd, max_plekken, status) VALUES (1, '2026-10-03', '10:00', 12, 'gesloten');
INSERT INTO sessie (id, datum, starttijd, max_plekken, status) VALUES (2, '2026-11-07', '10:00', 12, 'open');
INSERT INTO sessie (id, datum, starttijd, max_plekken, status) VALUES (3, '2026-12-05', '10:00', 12, 'open');
INSERT INTO sessie (id, datum, starttijd, max_plekken, status) VALUES (4, '2027-01-02', '10:00', 12, 'open');

INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (1, 'RC-2026-0001', 1, 'Pieter', 'pieter@voorbeeld.nl', 'Klein huishoudelijk', 'Krups XP3440', 'Espressoapparaat lekt en slaat af na een minuut.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (2, 'RC-2026-0002', 1, 'Aisha', 'aisha@voorbeeld.nl', 'Audio en beeld', 'JBL Flip 5', 'Speaker gaat niet meer aan na het opladen.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (3, 'RC-2026-0003', 1, 'Kees', 'kees@voorbeeld.nl', 'Fiets', 'Batavus Fonk', 'Achterrem piept en remt slecht.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (4, 'RC-2026-0004', 1, 'Noor', 'noor@voorbeeld.nl', 'Textiel', 'Wollen winterjas', 'Voering is gescheurd bij de mouw.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (5, 'RC-2026-0005', 2, 'Daan', 'daan@voorbeeld.nl', 'Klein huishoudelijk', 'Tefal FV1711', 'Strijkijzer wordt niet meer warm.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (6, 'RC-2026-0006', 2, 'Joris', 'joris@voorbeeld.nl', 'Fiets', 'Gazelle Chamonix', 'Versnelling slaat over in de derde versnelling.', 'geannuleerd');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (7, 'RC-2026-0007', 2, 'Lotte', 'lotte@voorbeeld.nl', 'Klein huishoudelijk', 'Senseo HD7865', 'Lekt water onder het apparaat na het zetten.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (8, 'RC-2026-0008', 2, 'Mehmet', 'mehmet@voorbeeld.nl', 'Audio en beeld', 'Sony SRS-XB13', 'Speaker laadt niet op, lampje knippert rood.', 'in_behandeling');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (9, 'RC-2026-0009', 2, 'Sanne', 'sanne@voorbeeld.nl', 'Klein huishoudelijk', 'Philips HD9650', 'Airfryer gaat niet meer aan, lampje brandt niet. Snoer ziet er goed uit.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (10, 'RC-2026-0010', 2, 'Eva', 'eva@voorbeeld.nl', 'Klein huishoudelijk', 'Bosch TAT3A011', 'Broodrooster springt niet meer omhoog.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (11, 'RC-2026-0011', 2, 'Bram', 'bram@voorbeeld.nl', 'Textiel', 'Spijkerjas', 'Rits is kapot en de trekker is eraf gevallen.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (12, 'RC-2026-0012', 2, 'Fatma', 'fatma@voorbeeld.nl', 'Computer en telefoon', 'Lenovo IdeaPad 3', 'Scharnier gebroken, scherm valt naar achteren.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (13, 'RC-2026-0013', 2, 'Ruben', 'ruben@voorbeeld.nl', 'Audio en beeld', 'Philips AE5250', 'Geen geluid meer, het display werkt wel.', 'afgerond');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (14, 'RC-2026-0014', 2, 'Ilse', 'ilse@voorbeeld.nl', 'Speelgoed en overig', 'IKEA Tertial', 'Bureaulamp flikkert en gaat soms uit.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (15, 'RC-2026-0015', 3, 'Bezoeker 1', 'bezoeker1@voorbeeld.nl', 'Klein huishoudelijk', 'Philips HR2100', 'Blender draait niet meer rond.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (16, 'RC-2026-0016', 3, 'Bezoeker 2', 'bezoeker2@voorbeeld.nl', 'Computer en telefoon', 'Samsung Galaxy A52', 'Oplaadpoort los, laadt alleen in één stand.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (17, 'RC-2026-0017', 3, 'Bezoeker 3', 'bezoeker3@voorbeeld.nl', 'Fiets', 'Cortina U4', 'Voorlicht werkt niet meer.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (18, 'RC-2026-0018', 3, 'Bezoeker 4', 'bezoeker4@voorbeeld.nl', 'Textiel', 'Rugzak Eastpak', 'Schouderband is losgescheurd.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (19, 'RC-2026-0019', 3, 'Bezoeker 5', 'bezoeker5@voorbeeld.nl', 'Klein huishoudelijk', 'Philips HR2100', 'Blender draait niet meer rond.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (20, 'RC-2026-0020', 3, 'Bezoeker 6', 'bezoeker6@voorbeeld.nl', 'Computer en telefoon', 'Samsung Galaxy A52', 'Oplaadpoort los, laadt alleen in één stand.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (21, 'RC-2026-0021', 3, 'Bezoeker 7', 'bezoeker7@voorbeeld.nl', 'Fiets', 'Cortina U4', 'Voorlicht werkt niet meer.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (22, 'RC-2026-0022', 3, 'Bezoeker 8', 'bezoeker8@voorbeeld.nl', 'Textiel', 'Rugzak Eastpak', 'Schouderband is losgescheurd.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (23, 'RC-2026-0023', 3, 'Bezoeker 9', 'bezoeker9@voorbeeld.nl', 'Klein huishoudelijk', 'Philips HR2100', 'Blender draait niet meer rond.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (24, 'RC-2026-0024', 3, 'Bezoeker 10', 'bezoeker10@voorbeeld.nl', 'Computer en telefoon', 'Samsung Galaxy A52', 'Oplaadpoort los, laadt alleen in één stand.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (25, 'RC-2026-0025', 3, 'Bezoeker 11', 'bezoeker11@voorbeeld.nl', 'Fiets', 'Cortina U4', 'Voorlicht werkt niet meer.', 'aangemeld');
INSERT INTO aanmelding (id, referentie, sessie_id, voornaam, email, categorie, merk_type, defect, status) VALUES (26, 'RC-2026-0026', 3, 'Bezoeker 12', 'bezoeker12@voorbeeld.nl', 'Textiel', 'Rugzak Eastpak', 'Schouderband is losgescheurd.', 'aangemeld');

INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (1, 1, 'gerepareerd', 'Snoer vervangen.', 35);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (2, 2, 'niet_gelukt', 'Accu defect, niet los te krijgen.', 25);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (3, 1, 'gerepareerd', 'Remblokken vervangen.', 30);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (4, 2, 'deels', 'Voering genaaid, knoop volgt.', 45);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (5, 1, 'gerepareerd', 'Thermostaat schoongemaakt.', 20);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (12, 2, 'niet_gelukt', 'Scharnier niet meer leverbaar.', 40);
INSERT INTO reparatie (aanmelding_id, vrijwilliger_id, uitkomst, notitie, minuten) VALUES (13, 1, 'deels', 'Schakelaar besteld, volgende sessie terug.', 20);
