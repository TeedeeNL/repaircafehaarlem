// Uitlogroute (FE-05). Er is geen pagina bij: dit is een API-route die alleen een POST afhandelt en doorstuurt.
// De uitlogknop in de header (components/Header.astro) is een klein formulier dat hierheen verstuurt.
import type { APIRoute } from 'astro';
import { beeindigSessie } from '../lib/auth/sessie';

export const prerender = false;

// Verwijdert de sessie uit de database en de cookie uit de browser.
// Alleen POST, geen GET: een link naar /uitloggen (bijvoorbeeld in een plaatje op een andere site) kan
// iemand dan niet ongemerkt uitloggen.
export const POST: APIRoute = async ({ cookies, redirect }) => {
  await beeindigSessie(cookies);
  return redirect('/login', 303);
};
