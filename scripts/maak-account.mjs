// Maakt een vrijwilligersaccount aan in D1. Het wachtwoord wordt verborgen gevraagd en nooit opgeslagen of getoond;
// alleen de PBKDF2-hash en salt gaan naar de database.
//
// Gebruik:
//   node scripts/maak-account.mjs --naam "Joost" --email joost@voorbeeld.nl --rol coordinator [--remote]
// Zonder --remote gaat het naar de lokale D1 in .wrangler/.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashWachtwoord } from './hash-wachtwoord.mjs';

function arg(naam) {
  const i = process.argv.indexOf(`--${naam}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const naam = arg('naam')?.trim();
const email = arg('email')?.trim().toLowerCase();
const rol = arg('rol') ?? 'vrijwilliger';
const remote = process.argv.includes('--remote');

if (!naam || naam.length > 60 || !email || !/^[^\s@']+@[^\s@']+\.[^\s@']{2,}$/.test(email) || !['vrijwilliger', 'coordinator'].includes(rol)) {
  console.error('Gebruik: node scripts/maak-account.mjs --naam "<naam>" --email <adres> --rol vrijwilliger|coordinator [--remote]');
  process.exit(1);
}

/** Leest een regel van de terminal zonder hem te tonen. */
function vraagVerborgen(vraag) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('Draai dit script in een terminal (wachtwoord wordt verborgen gevraagd).'));
    stdout.write(vraag);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let invoer = '';
    const opKey = (ch) => {
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off('data', opKey);
        stdout.write('\n');
        resolve(invoer);
      } else if (ch === '\u0003') {
        stdin.setRawMode(false);
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        invoer = invoer.slice(0, -1);
      } else {
        invoer += ch;
      }
    };
    stdin.on('data', opKey);
  });
}

const wachtwoord = await vraagVerborgen('Wachtwoord (minimaal 12 tekens): ');
if (wachtwoord.length < 12) {
  console.error('Te kort: gebruik minimaal 12 tekens.');
  process.exit(1);
}
if ((await vraagVerborgen('Nog een keer: ')) !== wachtwoord) {
  console.error('De wachtwoorden zijn niet gelijk.');
  process.exit(1);
}

const { hash, salt } = await hashWachtwoord(wachtwoord);
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const sql = `INSERT INTO vrijwilliger (naam, email, wachtwoord_hash, salt, rol) VALUES (${[naam, email, hash, salt, rol].map(q).join(', ')});`;

// Via een tijdelijk bestand, zodat geen shell de SQL kan verminken. Het bevat alleen hash en salt.
const map = mkdtempSync(join(tmpdir(), 'rc-account-'));
const bestand = join(map, 'account.sql');
writeFileSync(bestand, sql, { mode: 0o600 });
const res = spawnSync('npx', ['wrangler', 'd1', 'execute', 'DB', remote ? '--remote' : '--local', `--file=${bestand}`, '--yes'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
  encoding: 'utf8',
});
rmSync(map, { recursive: true, force: true });
if (res.status !== 0) {
  const fout = `${res.stdout}\n${res.stderr}`;
  console.error(/UNIQUE/.test(fout) ? 'Er bestaat al een account met dit e-mailadres.' : 'Aanmaken mislukt:\n' + fout.slice(-800));
  process.exit(1);
}
console.log(`Account aangemaakt voor ${naam} (${rol}) in de ${remote ? 'productie' : 'lokale'} database.`);
