import { prepareEncrypt } from "@ingenieria_insoft/ispclientjs";
import {
	TAuthError, TControllerClient, TError, TServerError, val2JSON, val2Str,
	type ServiciosInSoft, type TInfoConnection, type TJSONObject, type TObject, type TReqResponse
} from "@ingenieria_insoft/ispgen";
import { MensajesError, RutaLogin, RutaProxyApi, TimeoutPeticion } from "$lib/const";

// list() codifica el filtro en base64url con ISEncrypt, que en el navegador implementa ispclientjs
prepareEncrypt();

/**
 * Base de los controladores de Leads. El navegador nunca llama al API directamente: habla con el proxy
 * del mismo origen, y es el servidor SSR el que agrega el token y reenvía la petición.
 */
export abstract class TLeadsBaseClient<T extends TObject> extends TControllerClient<T> {

	// TControllerClient exige un nombre no vacío; la ubicación real la entrega getInfoServer
	public get nServer(): ServiciosInSoft { return "leads" as ServiciosInSoft }

	public get timeout(): number { return TimeoutPeticion }

	protected async getInfoServer(): Promise<boolean> {
		const bHttps: boolean = window.location.protocol === "https:";
		const puerto: number = Number(window.location.port || (bHttps ? 443 : 80));
		const conexion: TInfoConnection = { host: window.location.hostname, port: puerto, https: bHttps, restcontext: RutaProxyApi };
		this.infoConnection = conexion;
		return true;
	}

	// Resuelve los marcadores `:propiedad` con el objeto y agrega al final las llaves que no tengan marcador
	protected pathVariables(endPoint: string, Obj: T, bSoloPlaceholder: boolean = false): string {
		let ruta: string = endPoint;
		const marcadores: Array<string> = endPoint.match(/:[a-z0-9_]+/gi) ?? [];
		for (const marcador of marcadores)
			ruta = ruta.replace(marcador, encodeURIComponent(val2Str(Obj.getProp(marcador.slice(1)))));
		if (bSoloPlaceholder) return ruta;
		for (const llave of this.primaryKeys) {
			if (marcadores.includes(`:${String(llave)}`)) continue;
			ruta += `/${encodeURIComponent(val2Str(Obj.getProp(String(llave))))}`;
		}
		return ruta;
	}

	// Todo 2xx es éxito (el API responde 201 al crear y 202 al modificar). Un 401 es la sesión que terminó:
	// se vuelve al inicio de sesión con la ruta actual. Los 400 y 404 conservan el mensaje del servicio
	protected verifyResponse(res: TReqResponse): boolean {
		if (res.statusCode === 0) throw new TError(MensajesError.sinConexion);
		if (res.statusCode === 401) {
			window.location.assign(`${RutaLogin}?volver=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			throw new TAuthError(MensajesError.sesionVencida);
		}
		if (res.statusCode === 403) throw new TAuthError(MensajesError.sinAutorizacion);
		if (res.statusCode === 503) throw new TServerError(MensajesError.apiNoDisponible);
		if (res.statusCode >= 500) throw new TServerError(MensajesError.servidor);
		if (res.statusCode >= 200 && res.statusCode < 300) {
			const encabezado: TJSONObject = val2JSON(val2JSON(res.responseText, {}).encabezado, {});
			return encabezado.resultado !== false;
		}
		return super.verifyResponse(res);
	}
}
