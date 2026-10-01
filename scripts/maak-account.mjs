// Maakt een vrijwilligersaccount aan in D1. Het wachtwoord wordt verborgen gevraagd en nooit opgeslagen of getoond;
// alleen de PBKDF2-hash en salt gaan naar de database.
//
// Gebruik:
//   node scripts/maak-account.mjs --naam "Joost" --email joost@voorbeeld.nl --rol coordinator [--remote]
// Zonder --remote gaat het naar de lokale D1 in .wrangler/.
import { hashWachtwoord } from './hash-wachtwoord.mjs';
import { arg, EMAIL, q, vraagNieuwWachtwoord, voerSqlUit } from './terminal.mjs';

const naam = arg('naam')?.trim();
const email = arg('email')?.trim().toLowerCase();
const rol = arg('rol') ?? 'vrijwilliger';
const remote = process.argv.includes('--remote');

if (!naam || naam.length > 60 || !email || !EMAIL.test(email) || !['vrijwilliger', 'coordinator'].includes(rol)) {
  console.error('Gebruik: node scripts/maak-account.mjs --naam "<naam>" --email <adres> --rol vrijwilliger|coordinator [--remote]');
  process.exit(1);
}

const { hash, salt } = await hashWachtwoord(await vraagNieuwWachtwoord());
const res = voerSqlUit(
  `INSERT INTO vrijwilliger (naam, email, wachtwoord_hash, salt, rol) VALUES (${[naam, email, hash, salt, rol].map(q).join(', ')});`,
  remote,
);
if (!res.ok) {
  console.error(/UNIQUE/.test(res.fout) ? 'Er bestaat al een account met dit e-mailadres.' : 'Aanmaken mislukt:\n' + res.fout.slice(-800));
  process.exit(1);
}
console.log(`Account aangemaakt voor ${naam} (${rol}) in de ${remote ? 'productie' : 'lokale'} database.`);
