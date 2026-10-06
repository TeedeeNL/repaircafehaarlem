// Middleware: code die Astro bij ELK verzoek uitvoert, voordat de pagina zelf draait.
// Hier staat de inlogcontrole voor /crew en /beheer (FE-05, FE-08). Astro laadt dit bestand
// vanzelf, omdat het src/middleware.ts heet. Elke pagina hoeft dus niet zelf te controleren.
import { defineMiddleware } from 'astro:middleware';
import { huidigeGebruiker } from './lib/auth/sessie';

// Reguliere expressies (patronen) die bepalen welke paden beschermd zijn.
// "(\/|$)" zorgt dat /crew en /crew/account kloppen, maar /crewlid niet.
const BESCHERMD = /^\/(crew|beheer)(\/|$)/;
const COORDINATOR = /^\/beheer(\/|$)/;

/**
 * FE-05/FE-08: /crew en /beheer alleen met een geldige sessie (anders 302 naar /login),
 * /beheer alleen voor de coördinator (anders 403). Geldt voor elke methode, ook POST.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  // Eerst op null zetten. Zo kan een pagina nooit per ongeluk een gebruiker "erven"
  // van een eerder verzoek (ctx.locals is per verzoek, maar dit maakt het expliciet).
  ctx.locals.gebruiker = null;
  const pad = ctx.url.pathname;
  const beschermd = BESCHERMD.test(pad);

  // Prerendered pagina's en openbare routes hebben geen sessie nodig.
  // Prerender = de pagina is al bij het bouwen als HTML klaargezet, er is dan geen cookie om te lezen.
  // /login lezen we wel mee, zodat die pagina een al ingelogde gebruiker kan doorsturen.
  if (ctx.isPrerendered || (!beschermd && pad !== '/login')) return next();

  // We zoeken de gebruiker in de database via het cookie (zie lib/auth/sessie.ts).
  // De pagina's lezen daarna Astro.locals.gebruiker, ze doen zelf geen controle.
  ctx.locals.gebruiker = await huidigeGebruiker(ctx.cookies);
  if (!beschermd) return next();

  if (!ctx.locals.gebruiker) {
    // Bij een GET onthouden we de bedoelde pagina, zodat je na het inloggen daar terechtkomt.
    // Bij een POST sturen we alleen het pad mee, want een formulier kan niet opnieuw "teruggespeeld" worden.
    // encodeURIComponent maakt tekens als ? en & veilig voor in een URL.
    const terug = ctx.request.method === 'GET' ? pad + ctx.url.search : pad;
    return ctx.redirect(`/login?terug=${encodeURIComponent(terug)}`, 302);
  }

  if (COORDINATOR.test(pad) && ctx.locals.gebruiker.rol !== 'coordinator') {
    // Beveiliging: we geven 403 (verboden) in plaats van 302. Je bent wel ingelogd, maar mag hier niet komen.
    // De pagina (en een eventuele POST-afhandeling) wordt niet uitgevoerd.
    // next('/geen-toegang') toont een andere pagina, en wij zetten de status zelf op 403.
    const geenToegang = await next('/geen-toegang');
    return new Response(geenToegang.body, { status: 403, headers: geenToegang.headers });
  }

  const res = await next();
  // no-store: de browser en tussenliggende caches mogen deze pagina niet bewaren.
  // Anders zou iemand na uitloggen met de terugknop persoonsgegevens kunnen zien.
  res.headers.set('Cache-Control', 'no-store');
  return res;
});
