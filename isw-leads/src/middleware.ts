import { defineMiddleware } from "astro:middleware";
import { leerSesion } from "$lib/1.api/Leads_Sesion";
import { CookieSesion, RutaLogin } from "$lib/const";

// Rutas que exigen sesión; las de /api responden 401 por su cuenta y no redirigen
const RutasPrivadas: Array<RegExp> = [/^\/leads(\/|$)/];

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.sesion = leerSesion(context.cookies);
	// Un token vencido o ilegible se borra, para que el inicio de sesión no lo tome por vigente
	if (!context.locals.sesion && context.cookies.has(CookieSesion)) context.cookies.delete(CookieSesion, { path: "/" });

	const bPrivada: boolean = RutasPrivadas.some((ruta: RegExp): boolean => ruta.test(context.url.pathname));
	if (bPrivada && !context.locals.sesion) {
		const volver: string = context.url.pathname + context.url.search;
		return context.redirect(`${RutaLogin}?volver=${encodeURIComponent(volver)}`);
	}
	return next();
});
