import type { APIRoute } from 'astro';
import { beeindigSessie } from '../lib/auth/sessie';

export const prerender = false;

// Verwijdert de sessie uit de database en de cookie uit de browser.
export const POST: APIRoute = async ({ cookies, redirect }) => {
  await beeindigSessie(cookies);
  return redirect('/login', 303);
};
