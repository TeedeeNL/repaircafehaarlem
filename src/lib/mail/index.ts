import { env } from 'cloudflare:workers';

/** Een uitgaande e-mail. */
export interface Bericht {
  aan: string;
  onderwerp: string;
  tekst: string;
  /** Voorkomt dubbele mails als hetzelfde bericht nog eens wordt verstuurd, bijv. "bevestiging/RC-2026-0009". */
  sleutel?: string;
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

/**
 * Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Ontbreekt de sleutel of de afzender, dan mislukt het versturen hoorbaar in plaats van stil.
 */
export function resendMailer(apiKey: string | undefined, afzender: string | undefined): Mailer {
  return {
    async verstuur(b) {
      if (!apiKey) throw new Error('RESEND_API_KEY ontbreekt');
      if (!afzender) throw new Error('MAIL_AFZENDER ontbreekt');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(b.sleutel ? { 'Idempotency-Key': b.sleutel } : {}),
        },
        body: JSON.stringify({ from: afzender, to: [b.aan], subject: b.onderwerp, text: b.tekst }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        // Alleen status en fouttype van Resend; de volledige melding kan het adres bevatten.
        const soort = await res
          .json()
          .then((d) => (d as { name?: string }).name ?? 'onbekend')
          .catch(() => 'onbekend');
        throw new Error(`Resend weigerde de mail: HTTP ${res.status} (${soort})`);
      }
    },
  };
}

export function mailer(): Mailer {
  switch (env.MAIL_MODUS) {
    case 'resend':
      return resendMailer(env.RESEND_API_KEY, env.MAIL_AFZENDER);
    case 'console':
      return consoleMailer;
    default:
      return uitMailer;
  }
}
