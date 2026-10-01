// Gedeelde hulpjes voor de accountscripts.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function arg(naam) {
  const i = process.argv.indexOf(`--${naam}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

export const EMAIL = /^[^\s@']+@[^\s@']+\.[^\s@']{2,}$/;

/** Zet een waarde veilig tussen enkele aanhalingstekens voor SQLite. */
export const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

/** Leest een regel van de terminal zonder hem te tonen. */
export function vraagVerborgen(vraag) {
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

/** Vraagt een nieuw wachtwoord twee keer en controleert de lengte. */
export async function vraagNieuwWachtwoord() {
  const wachtwoord = await vraagVerborgen('Nieuw wachtwoord (minimaal 12 tekens): ');
  if (wachtwoord.length < 12) {
    console.error('Te kort: gebruik minimaal 12 tekens.');
    process.exit(1);
  }
  if ((await vraagVerborgen('Nog een keer: ')) !== wachtwoord) {
    console.error('De wachtwoorden zijn niet gelijk.');
    process.exit(1);
  }
  return wachtwoord;
}

/**
 * Voert SQL uit op D1 via Wrangler. Via een tijdelijk bestand, zodat geen shell de SQL kan verminken;
 * het bestand bevat nooit een wachtwoord, alleen hash en salt. Geeft de JSON-resultaten terug.
 */
export function voerSqlUit(sql, remote) {
  const map = mkdtempSync(join(tmpdir(), 'rc-account-'));
  const bestand = join(map, 'account.sql');
  writeFileSync(bestand, sql, { mode: 0o600 });
  const res = spawnSync('npx', ['wrangler', 'd1', 'execute', 'DB', remote ? '--remote' : '--local', `--file=${bestand}`, '--yes', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  rmSync(map, { recursive: true, force: true });
  if (res.status !== 0) {
    const fout = `${res.stdout}\n${res.stderr}`;
    return { ok: false, fout };
  }
  try {
    const start = res.stdout.indexOf('[');
    return { ok: true, resultaten: JSON.parse(res.stdout.slice(start)) };
  } catch {
    return { ok: true, resultaten: [] };
  }
}
