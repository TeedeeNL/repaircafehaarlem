// Gedeelde hulpjes voor de accountscripts.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

const WRANGLER = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

/**
 * Voert SQL uit op D1 via Wrangler. Wrangler draait direct via Node zonder shell, zodat niets de SQL
 * kan verminken. Bewust --command en geen --file: remote gaat --file via de import-API, die alleen
 * statistieken teruggeeft en geen rijen. De SQL bevat nooit een wachtwoord, alleen hash en salt.
 */
export function voerSqlUit(sql, remote) {
  const res = spawnSync(process.execPath, [WRANGLER, 'd1', 'execute', 'DB', remote ? '--remote' : '--local', '--command', sql, '--yes', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
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
