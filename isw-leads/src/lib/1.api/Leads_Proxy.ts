import type { APIContext } from "astro";
import { isBool, val2Str } from "@ingenieria_insoft/ispgen";
import { MensajesError, TimeoutPeticion, UrlApiDefecto } from "$lib/const";

// Solo se reenvían rutas del contrato de Leads, para que el proxy no sirva de puente hacia otras rutas
const RutaPermitida: RegExp = /^leads(\/[A-Za-z0-9_=-]+)*$/;
const MetodosConCuerpo: Array<string> = ["POST", "PUT"];

/**
 * Reenvía la petición del navegador al API de Leads. Aquí, y solo aquí, se arma el header
 * `Authorization: Bearer` con API_TOKEN, que vive en el ambiente del servidor y nunca llega al navegador.
 */
export async function reenviarAlApi(context: APIContext): Promise<Response> {
	const ruta: string = val2Str(context.params.ruta);
	if (!RutaPermitida.test(ruta)) return respuestaError(404, MensajesError.rutaNoEncontrada);
	if (!esMismoOrigen(context)) return respuestaError(403, MensajesError.sinAutorizacion);

	const env: Env = context.locals.runtime?.env ?? {};
	const urlApi: string = val2Str(env.API_URL, UrlApiDefecto).replace(/\/+$/, "");
	const encabezados: Headers = new Headers({ "Accept": "application/json", "Content-Type": "application/json" });
	if (isBool(env.API_TOKEN)) encabezados.set("Authorization", `Bearer ${env.API_TOKEN}`);

	const metodo: string = context.request.method;
	const cuerpo: string | undefined = MetodosConCuerpo.includes(metodo) ? await context.request.text() : undefined;
	try {
		const respuesta: Response = await fetch(`${urlApi}/${ruta}`, {
			method: metodo,
			headers: encabezados,
			body: cuerpo,
			signal: AbortSignal.timeout(TimeoutPeticion),
		});
		const tipoContenido: string = respuesta.headers.get("Content-Type") ?? "application/json; charset=utf-8";
		// Response no admite cuerpo en 204, 205 y 304
		const bSinCuerpo: boolean = [204, 205, 304].includes(respuesta.status);
		const contenido: string | null = bSinCuerpo ? null : await respuesta.text();
		return new Response(contenido, { status: respuesta.status, headers: { "Content-Type": tipoContenido } });
	} catch {
		return respuestaError(503, MensajesError.apiNoDisponible);
	}
}

// Un sitio ajeno no puede usar el proxy para escribir: el navegador siempre envía Origin en esas peticiones
function esMismoOrigen(context: APIContext): boolean {
	if (context.request.method === "GET") return true;
	const origen: string | null = context.request.headers.get("Origin");
	return origen === null || origen === context.url.origin;
}

// Misma forma de respuesta que RstError del servidor, para que el cliente la lea igual
function respuestaError(estado: number, mensaje: string): Response {
	const cuerpo: string = JSON.stringify({ encabezado: { resultado: false, imensaje: estado, mensaje } });
	return new Response(cuerpo, { status: estado, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
