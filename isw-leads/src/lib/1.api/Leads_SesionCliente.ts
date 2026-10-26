import { TAuthError, TError, TRequestError, TServerError, isBool, val2JSON, val2Str, type TJSONObject } from "@ingenieria_insoft/ispgen";
import { MensajesError, TimeoutPeticion } from "$lib/const";

/**
 * Inicio y cierre de sesión desde el navegador. Habla con /api/sesion del propio sitio, que guarda el token en
 * una cookie httpOnly: el JavaScript del navegador nunca lo recibe.
 */
export class TSesionClient {

	public async Ingresar(usuario: string, clave: string): Promise<void> {
		if (!isBool(usuario.trim())) throw new TRequestError("Escribe tu usuario.");
		if (!isBool(clave)) throw new TRequestError("Escribe tu clave.");
		await this.enviar("POST", { usuario: usuario.trim(), clave });
	}

	public async Salir(): Promise<void> {
		await this.enviar("DELETE");
	}

	// Los 400 y 401 traen un mensaje claro del servicio («Usuario o clave incorrectos»); lo demás se traduce
	protected async enviar(metodo: "POST" | "DELETE", cuerpo?: TJSONObject): Promise<void> {
		let respuesta: Response;
		try {
			respuesta = await fetch("/api/sesion", {
				method: metodo,
				headers: { "Accept": "application/json", "Content-Type": "application/json" },
				body: cuerpo ? JSON.stringify(cuerpo) : undefined,
				signal: AbortSignal.timeout(TimeoutPeticion),
			});
		} catch {
			throw new TError(MensajesError.sinConexion);
		}
		if (respuesta.ok) return;
		const mensaje: string = val2Str(val2JSON(val2JSON(await respuesta.text(), {}).encabezado, {}).mensaje);
		if (respuesta.status === 401) throw new TAuthError(mensaje || "Usuario o clave incorrectos.");
		if (respuesta.status === 400) throw new TRequestError(mensaje || "Revisa tu usuario y tu clave.");
		if (respuesta.status === 503) throw new TServerError(MensajesError.apiNoDisponible);
		throw new TServerError(MensajesError.servidor);
	}
}
