/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Ingelogde vrijwilliger, gezet door de middleware op /login, /crew en /beheer. */
    gebruiker: import('./lib/domein').Gebruiker | null;
  }
}
