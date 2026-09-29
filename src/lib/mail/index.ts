import { env } from 'cloudflare:workers';

/** Een uitgaande e-mail. */
export interface Bericht {
  aan: string;
  onderwerp: string;
  tekst: string;
}

/** Verstuurt mail. Gooit een fout als versturen mislukt; de aanroeper beslist wat er dan gebeurt. */
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
    throw new Error('Geen mailprovider ingesteld');
  },
};

export function mailer(): Mailer {
  return env.MAIL_MODUS === 'console' ? consoleMailer : uitMailer;
}
