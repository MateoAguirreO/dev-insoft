import type { APIContext, AstroCookies } from "astro";
import { isBool, val2Int, val2JSON, val2Str, type TJSONObject } from "@ingenieria_insoft/ispgen";
import { CookieSesion, IAppWeb, MensajesError, RutaInicio, RutaLogin, TimeoutPeticion } from "$lib/const";
import { esMismoOrigen, respuestaError, respuestaJSON, urlApi } from "$lib/1.api/Leads_Proxy";

/** Sesión de la web leída del token: sirve para mostrar el usuario y decidir redirecciones; el API valida el token */
export interface TSesionWeb {
	usuario: string;
	vence: Date;
}

/**
 * Lee la sesión del token de la cookie sin verificar la firma: eso lo hace el API en cada petición.
 * @param cookies cookies de la petición
 * @returns la sesión, o `undefined` si no hay cookie, el token no se puede leer o ya venció
 */
export function leerSesion(cookies: AstroCookies): TSesionWeb | undefined {
	const payload: string = val2Str(cookies.get(CookieSesion)?.value).split(".")[1] ?? "";
	if (!isBool(payload)) return undefined;
	try {
		const bytes: Uint8Array = Uint8Array.from(atob(payload.replace(/-/g, "+").replace(/_/g, "/")), (c: string): number => c.charCodeAt(0));
		const datos: TJSONObject = val2JSON(new TextDecoder().decode(bytes), {});
		const vence: Date = new Date(val2Int(datos.exp) * 1000);
		if (!isBool(datos.usuario) || vence.getTime() <= Date.now()) return undefined;
		return { usuario: val2Str(datos.usuario), vence };
	} catch {
		return undefined;
	}
}

/**
 * Ruta a la que vuelve el usuario después de iniciar sesión. Solo se acepta una del mismo sitio: armarla con
 * `new URL(ruta, origen)` descarta también `//dominio` y `/\dominio`, que salen del sitio aunque empiecen por `/`.
 * @param volver ruta que llega en `?volver=`
 * @param origen origen del sitio
 * @returns la ruta validada, o la de inicio si no sirve
 */
export function rutaDeRetorno(volver: string | null, origen: string): string {
	if (!isBool(volver)) return RutaInicio;
	try {
		const Destino: URL = new URL(val2Str(volver), origen);
		if (Destino.origin !== origen || Destino.pathname === RutaLogin || Destino.pathname.startsWith("/api/")) return RutaInicio;
		return Destino.pathname + Destino.search + Destino.hash;
	} catch {
		return RutaInicio;
	}
}

/**
 * Inicia sesión en el API con usuario y clave y guarda el token en la cookie httpOnly. Al navegador solo le
 * responde el usuario y el vencimiento: el token no sale del servidor.
 * @param context petición con `usuario` y `clave` en el cuerpo
 * @returns 201 si inició sesión, o el error del API (400 o 401) con su mensaje
 */
export async function iniciarSesion(context: APIContext): Promise<Response> {
	if (!esMismoOrigen(context)) return respuestaError(403, MensajesError.sinAutorizacion);
	const datos: TJSONObject = val2JSON(await context.request.text(), {});
	let respuesta: Response;
	try {
		respuesta = await fetch(`${urlApi(context)}/sesiones`, {
			method: "POST",
			headers: { "Accept": "application/json", "Content-Type": "application/json" },
			body: JSON.stringify({ usuario: val2Str(datos.usuario), clave: val2Str(datos.clave), iapp: IAppWeb, iequipo: 0 }),
			signal: AbortSignal.timeout(TimeoutPeticion),
		});
	} catch {
		return respuestaError(503, MensajesError.apiNoDisponible);
	}

	const resultado: TJSONObject = val2JSON(await respuesta.text(), {});
	if (respuesta.status >= 500) return respuestaError(503, MensajesError.apiNoDisponible);
	if (respuesta.status !== 201) return respuestaJSON(respuesta.status, resultado);

	const sesion: TJSONObject = val2JSON(val2JSON(resultado.respuesta, {}).datos, {});
	context.cookies.set(CookieSesion, val2Str(sesion.token), {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		path: "/",
		expires: new Date(val2Str(sesion.fhvence)),
	});
	return respuestaJSON(201, { encabezado: { resultado: true }, respuesta: { datos: { usuario: sesion.usuario, fhvence: sesion.fhvence } } });
}

/**
 * Cierra la sesión en el API y borra la cookie. La cookie se borra aunque el API no responda: en el navegador
 * la sesión termina igual.
 * @param context petición con la cookie de sesión
 * @returns 200 con la sesión cerrada
 */
export async function cerrarSesion(context: APIContext): Promise<Response> {
	if (!esMismoOrigen(context)) return respuestaError(403, MensajesError.sinAutorizacion);
	const token: string = val2Str(context.cookies.get(CookieSesion)?.value);
	if (isBool(token)) {
		try {
			await fetch(`${urlApi(context)}/sesiones/actual`, {
				method: "DELETE",
				headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
				signal: AbortSignal.timeout(TimeoutPeticion),
			});
		} catch {
			// El API no respondió: la sesión vencerá sola y la cookie se borra de todas formas
		}
	}
	context.cookies.delete(CookieSesion, { path: "/" });
	return respuestaJSON(200, { encabezado: { resultado: true }, respuesta: { datos: { cerrada: true } } });
}
