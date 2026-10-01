// Wijzigt het e-mailadres en/of het wachtwoord van een bestaand vrijwilligersaccount in D1.
// Het nieuwe wachtwoord wordt verborgen gevraagd; alleen hash en salt gaan naar de database.
// Na een wijziging worden alle bestaande loginsessies van het account beëindigd (opnieuw inloggen).
//
// Gebruik:
//   node scripts/wijzig-account.mjs --email <huidig adres> [--nieuw-email <adres>] [--wachtwoord] [--remote]
import { hashWachtwoord } from './hash-wachtwoord.mjs';
import { arg, EMAIL, q, vraagNieuwWachtwoord, voerSqlUit } from './terminal.mjs';

const huidig = arg('email')?.trim().toLowerCase();
const nieuwEmail = arg('nieuw-email')?.trim().toLowerCase();
const wachtwoordWijzigen = process.argv.includes('--wachtwoord');
const remote = process.argv.includes('--remote');

if (!huidig || !EMAIL.test(huidig) || (!nieuwEmail && !wachtwoordWijzigen) || (nieuwEmail && !EMAIL.test(nieuwEmail))) {
  console.error('Gebruik: node scripts/wijzig-account.mjs --email <huidig adres> [--nieuw-email <adres>] [--wachtwoord] [--remote]');
  console.error('Geef minstens --nieuw-email of --wachtwoord mee.');
  process.exit(1);
}

// Bestaat het account?
const check = voerSqlUit(`SELECT id FROM vrijwilliger WHERE email = ${q(huidig)};`, remote);
const rij = check.ok ? check.resultaten?.[0]?.results?.[0] : undefined;
if (!Number.isInteger(rij?.id)) {
  console.error(check.ok ? 'Geen account gevonden met dat e-mailadres.' : 'Opzoeken mislukt:\n' + check.fout.slice(-800));
  process.exit(1);
}

const sets = [];
if (nieuwEmail) sets.push(`email = ${q(nieuwEmail)}`);
if (wachtwoordWijzigen) {
  const { hash, salt } = await hashWachtwoord(await vraagNieuwWachtwoord());
  sets.push(`wachtwoord_hash = ${q(hash)}`, `salt = ${q(salt)}`);
}

const id = rij.id;
const res = voerSqlUit(
  `UPDATE vrijwilliger SET ${sets.join(', ')} WHERE id = ${id};\nDELETE FROM login_sessie WHERE vrijwilliger_id = ${id};`,
  remote,
);
if (!res.ok) {
  console.error(/UNIQUE/.test(res.fout) ? 'Er bestaat al een ander account met het nieuwe e-mailadres.' : 'Wijzigen mislukt:\n' + res.fout.slice(-800));
  process.exit(1);
}

const wat = [nieuwEmail && `e-mailadres naar ${nieuwEmail}`, wachtwoordWijzigen && 'wachtwoord'].filter(Boolean).join(' en ');
console.log(`Gewijzigd: ${wat} (${remote ? 'productie' : 'lokale'} database). Log opnieuw in.`);
