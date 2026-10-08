import { env } from 'cloudflare:workers';

/** Een uitgaande e-mail. */
export interface Bericht {
  aan: string;
  onderwerp: string;
  tekst: string;
}

/**
 * Verstuurt mail. Gooit een fout als versturen mislukt; de aanroeper beslist wat er dan gebeurt.
 * Foutmeldingen bevatten nooit het adres of de inhoud, zodat ze veilig gelogd kunnen worden.
 */
export interface Mailer {
  verstuur(bericht: Bericht): Promise<void>;
}

/** Maskeert een adres voor de log: s***@voorbeeld.nl. */
function maskeer(email: string): string {
  const [naam = '', domein = ''] = email.split('@');
  return `${naam.slice(0, 1)}***@${domein}`;
}

/** Dev: schrijft de mail naar de console. Het adres wordt gemaskeerd. */
export const consoleMailer: Mailer = {
  async verstuur(b) {
    console.log(`[mail] aan ${maskeer(b.aan)} · ${b.onderwerp}\n${b.tekst}`);
  },
};

/** Geen mailprovider ingesteld: versturen mislukt altijd, de aanmelding blijft staan. */
export const uitMailer: Mailer = {
  async verstuur() {
    throw new Error('Geen mailprovider ingesteld (MAIL_MODUS=uit)');
  },
};

/** Splitst "Naam <adres@domein.nl>" in naam en adres. Een kaal adres geeft alleen een adres. */
function splitsAfzender(afzender: string): { email: string; name?: string } {
  const m = afzender.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  return m ? { email: m[2]!, ...(m[1] ? { name: m[1] } : {}) } : { email: afzender.trim() };
}

/**
 * Brevo (EU-bedrijf, transactionele mail via https://api.brevo.com/v3/smtp/email).
 * Het afzenderdomein moet bij Brevo geverifieerd zijn (Senders, Domains & Dedicated IPs).
 * Foutmeldingen bevatten alleen de status, nooit het adres of de inhoud, zodat ze veilig gelogd kunnen worden.
 */
export function brevoMailer(apiKey: string | undefined, afzender: string | undefined): Mailer {
  return {
    async verstuur(b) {
      if (!apiKey) throw new Error('BREVO_API_KEY ontbreekt');
      if (!afzender) throw new Error('MAIL_AFZENDER ontbreekt');
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: splitsAfzender(afzender),
          to: [{ email: b.aan }],
          subject: b.onderwerp,
          textContent: b.tekst,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Brevo weigerde de mail: HTTP ${res.status}`);
    },
  };
}

export function mailer(): Mailer {
  // BREVO_API_KEY is een secret en staat niet altijd in de gegenereerde types.
  const sleutel = (env as unknown as { BREVO_API_KEY?: string }).BREVO_API_KEY;
  switch (env.MAIL_MODUS) {
    case 'brevo':
      return brevoMailer(sleutel, env.MAIL_AFZENDER);
    case 'console':
      return consoleMailer;
    default:
      return uitMailer;
  }
}
