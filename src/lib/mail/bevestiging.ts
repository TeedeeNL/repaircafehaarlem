import type { Bericht } from './index';
import { datumLang } from '../format';
import { LOCATIE } from '../site';

// FE-04: referentienummer, datum, tijd, adres, huisregels en de link naar de statusopvraag.
// Bewust zonder voornaam, zodat er in een log nooit een naam bij een adres staat.
export function bevestigingsmail(g: {
  email: string;
  referentie: string;
  datum: string;
  starttijd: string;
  merk_type: string;
  basisUrl: string;
}): Bericht {
  return {
    aan: g.email,
    onderwerp: `Je aanmelding ${g.referentie} bij Repair Cafe Haarlem`,
    tekst: [
      'Hallo,',
      '',
      'Je aanmelding bij Repair Cafe Haarlem is gelukt.',
      '',
      `Referentienummer: ${g.referentie}`,
      `Wanneer: ${datumLang(g.datum)}, ${g.starttijd} uur`,
      `Waar: ${LOCATIE}`,
      `Apparaat: ${g.merk_type}`,
      '',
      'Neem mee: het apparaat, de stekker, het snoer of de oplader, en dit referentienummer.',
      'Maximaal één apparaat per persoon, en je blijft erbij.',
      `Huisregels: ${g.basisUrl}/info/huisregels`,
      '',
      `Status bekijken: ${g.basisUrl}/status`,
      '',
      'Tot dan!',
      'Repair Cafe Haarlem',
    ].join('\n'),
  };
}
