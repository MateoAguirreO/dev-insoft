import type { APIContext } from "astro";
import { isBool, val2Str, type TJSONObject } from "@ingenieria_insoft/ispgen";
import { CookieSesion, MensajesError, TimeoutPeticion, UrlApiDefecto } from "$lib/const";

// Solo se reenvían rutas del contrato de Leads, para que el proxy no sirva de puente hacia otras rutas
const RutaPermitida: RegExp = /^leads(\/[A-Za-z0-9_=-]+)*$/;
const MetodosConCuerpo: Array<string> = ["POST", "PUT"];

/**
 * Reenvía la petición del navegador al API de Leads. Aquí, y solo aquí, se arma el header `Authorization: Bearer`
 * con el token de la cookie de sesión, que es httpOnly: el JavaScript del navegador nunca lo ve.
 */
export async function reenviarAlApi(context: APIContext): Promise<Response> {
	const ruta: string = val2Str(context.params.ruta);
	if (!RutaPermitida.test(ruta)) return respuestaError(404, MensajesError.rutaNoEncontrada);
	if (!esMismoOrigen(context)) return respuestaError(403, MensajesError.sinAutorizacion);
	// Sin sesión no se llama al API: las rutas de /api responden 401 y no redirigen
	const token: string = val2Str(context.cookies.get(CookieSesion)?.value);
	if (!isBool(token)) return respuestaError(401, MensajesError.sesionVencida);

	const encabezados: Headers = new Headers({ "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${token}` });
	const metodo: string = context.request.method;
	const cuerpo: string | undefined = MetodosConCuerpo.includes(metodo) ? await context.request.text() : undefined;
	try {
		const respuesta: Response = await fetch(`${urlApi(context)}/${ruta}`, {
			method: metodo,
			headers: encabezados,
			body: cuerpo,
			signal: AbortSignal.timeout(TimeoutPeticion),
		});
		// El API rechazó el token (venció, se cerró la sesión o el usuario se desactivó): la cookie ya no sirve
		if (respuesta.status === 401) context.cookies.delete(CookieSesion, { path: "/" });
		const tipoContenido: string = respuesta.headers.get("Content-Type") ?? "application/json; charset=utf-8";
		// Response no admite cuerpo en 204, 205 y 304
		const bSinCuerpo: boolean = [204, 205, 304].includes(respuesta.status);
		const contenido: string | null = bSinCuerpo ? null : await respuesta.text();
		return new Response(contenido, { status: respuesta.status, headers: { "Content-Type": tipoContenido } });
	} catch {
		return respuestaError(503, MensajesError.apiNoDisponible);
	}
}

/** URL base del API de Leads: la variable API_URL del Worker (`.dev.vars` en local) o la de desarrollo */
export function urlApi(context: APIContext): string {
	const env: Env = context.locals.runtime?.env ?? {};
	return val2Str(env.API_URL, UrlApiDefecto).replace(/\/+$/, "");
}

// Un sitio ajeno no puede usar el proxy para escribir: el navegador siempre envía Origin en esas peticiones
export function esMismoOrigen(context: APIContext): boolean {
	if (context.request.method === "GET") return true;
	const origen: string | null = context.request.headers.get("Origin");
	return origen === null || origen === context.url.origin;
}

// Misma forma de respuesta que RstError del servidor, para que el cliente la lea igual
export function respuestaError(estado: number, mensaje: string): Response {
	return respuestaJSON(estado, { encabezado: { resultado: false, imensaje: estado, mensaje } });
}

export function respuestaJSON(estado: number, cuerpo: TJSONObject): Response {
	return new Response(JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
