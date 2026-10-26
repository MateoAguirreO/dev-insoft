import { TObject, TRequestError, TResourceNotFound, isBool, val2Str, type TListaPaginacion } from "@ingenieria_insoft/ispgen";
import { TLeadsBaseClient } from "$lib/1.api/Leads_ClienteBase";
import { MensajesPorPagina } from "$lib/const";
import { TLeadMensaje } from "$lib/ispleads/010 Objetos/TLeadMensaje";

/** Controlador de los mensajes de un lead: se registran, se listan y se consultan; no se editan ni se eliminan */
export class TLeadMensajesClient extends TLeadsBaseClient<TLeadMensaje> {

	public get klass(): typeof TObject { return TLeadMensaje }
	public get primaryKeys(): Array<keyof TLeadMensaje> { return ["imensaje"] }
	public get entrie(): string { return "Mensaje" }
	public get entries(): string { return "Mensajes" }

	public get nEndPoint(): string { return "leads/:ilead/mensajes" }
	public get nEndPointListado(): string { return "leads/:ilead/mensajes" }

	// Los más recientes primero
	public Lista(ilead: number, pagina: number): Promise<TListaPaginacion<TLeadMensaje>> {
		return this.list({ pagina, qregistros: MensajesPorPagina, filtro: { ilead }, orden: { fhenvio: "DESC" } }, this.timeout);
	}

	public async Obtener(ilead: number, imensaje: number): Promise<TLeadMensaje> {
		try {
			return await this.get({ ilead, imensaje }, this.timeout);
		} catch (error) {
			if (error instanceof TResourceNotFound) throw new TResourceNotFound("No encontramos este mensaje.");
			throw error;
		}
	}

	public Registrar(Obj: TLeadMensaje): Promise<TLeadMensaje> {
		this.validar(Obj);
		return this.insert(Obj, this.timeout);
	}

	protected validar(Obj: TLeadMensaje): void {
		Obj.asunto = val2Str(Obj.asunto).trim();
		if (!isBool(Obj.email)) throw new TRequestError("Elige el correo al que enviaste el mensaje.");
		if (!isBool(Obj.asunto)) throw new TRequestError("Escribe el asunto del mensaje.");
	}
}
