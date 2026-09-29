import { db } from './client';
import type { Gebruiker } from '../domein';

export interface VrijwilligerMetHash extends Gebruiker {
  wachtwoord_hash: string;
  salt: string;
}

export function vrijwilligerOpEmail(email: string): Promise<VrijwilligerMetHash | null> {
  return db()
    .prepare('SELECT id, naam, email, rol, wachtwoord_hash, salt FROM vrijwilliger WHERE email = ?1')
    .bind(email)
    .first<VrijwilligerMetHash>();
}
