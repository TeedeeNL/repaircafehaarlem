import { defineMiddleware } from 'astro:middleware';
import { huidigeGebruiker } from './lib/auth/sessie';

const BESCHERMD = /^\/(crew|beheer)(\/|$)/;
const COORDINATOR = /^\/beheer(\/|$)/;

/**
 * F-05/F-08: /crew en /beheer alleen met een geldige sessie (anders 302 naar /login),
 * /beheer alleen voor de coördinator (anders 403). Geldt voor elke methode, ook POST.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.gebruiker = null;
  const pad = ctx.url.pathname;
  const beschermd = BESCHERMD.test(pad);

  // Prerendered pagina's en openbare routes hebben geen sessie nodig.
  if (ctx.isPrerendered || (!beschermd && pad !== '/login')) return next();

  ctx.locals.gebruiker = await huidigeGebruiker(ctx.cookies);
  if (!beschermd) return next();

  if (!ctx.locals.gebruiker) {
    const terug = ctx.request.method === 'GET' ? pad + ctx.url.search : pad;
    return ctx.redirect(`/login?terug=${encodeURIComponent(terug)}`, 302);
  }

  if (COORDINATOR.test(pad) && ctx.locals.gebruiker.rol !== 'coordinator') {
    // De pagina (en een eventuele POST-afhandeling) wordt niet uitgevoerd.
    const geenToegang = await next('/geen-toegang');
    return new Response(geenToegang.body, { status: 403, headers: geenToegang.headers });
  }

  const res = await next();
  res.headers.set('Cache-Control', 'no-store');
  return res;
});
