import { isBool, TErr400, TFiltroLista, TJSONObject, TListaPaginacion, val2Int } from "@ingenieria_insoft/ispgen";
import { Rst400 } from "@ingenieria_insoft/ispserver";
import { TLeadMensaje } from "../010 Objetos/030_UlLeadMensaje";
import { secuencias, tablas } from "../010 UlConst";
import { TSistemaLeads } from "./001_UlSistemaLeads";

/** Mensajes enviados a un lead (`leads_mensajes`): se registran, se listan por lead y se consultan. */
export class TLeadMensajeController extends TSistemaLeads<TLeadMensaje> {

	public get nTbl(): tablas { return tablas.ntblLeadsMensajes }
	public get klass(): typeof TLeadMensaje { return TLeadMensaje }

	// Igual que en TLeadController: el idnfiltro del base depende de SOUNDEX y no usa su valor.
	protected columnsIdnFilter(): Array<string> { return [] }

	/** `ilead` de la ruta `leads/{ilead}/mensajes`; `undefined` si la petición no lo trae. */
	private get ileadRuta(): number | undefined {
		const sIlead: string | undefined = this.params.ilead;
		if (sIlead === undefined) return undefined;
		return val2Int(sIlead);
	}

	/**
	 * Lista los mensajes del lead de la ruta. El filtro por columnas del base no se aplica, así que el lead
	 * se impone en `filtro.sql` con el `ilead` ya convertido a entero; el `filtro.sql` del consumidor se descarta.
	 * @param JBody filtro, orden y paginación que envía el consumidor
	 * @returns la página de mensajes del lead
	 * @throws Rst401 si el token no es válido
	 * @throws Rst400 si la ruta no trae un `ilead` válido
	 */
	public async list(JBody: TFiltroLista<TLeadMensaje>): Promise<TListaPaginacion<TLeadMensaje>> {
		await this.verifyAuthorization();
		const ileadRuta: number | undefined = this.ileadRuta;
		if (!ileadRuta) throw Rst400(TErr400.param, "ilead");
		if (!JBody.filtro) JBody.filtro = {};
		JBody.filtro.sql = `${this.Conn.quoteCol("ilead")}=${ileadRuta}`;
		return super.list(JBody);
	}

	/**
	 * Obtiene el mensaje y lo descarta si no pertenece al lead pedido, así un mensaje de otro lead responde 404.
	 * @param obj mensaje con su `imensaje` y, si viene de la ruta, el `ilead`
	 * @returns el mensaje, o `false` si no existe o es de otro lead
	 */
	public async tryGet(obj: TLeadMensaje | TJSONObject): Promise<TLeadMensaje | false> {
		const Mensaje: TLeadMensaje = (obj instanceof TLeadMensaje) ? obj : TLeadMensaje.JSONToObject<TLeadMensaje>(obj);
		const ileadPedido: number | undefined = Mensaje.ilead;
		const MensajeBD: TLeadMensaje | false = await super.tryGet(Mensaje);
		if (MensajeBD && ileadPedido !== undefined && MensajeBD.ilead !== ileadPedido) return false;
		return MensajeBD;
	}

	/**
	 * Completa y valida el mensaje antes de registrarlo: lead de la ruta, fecha de envío, destinatario y llave.
	 * El token se valida primero, para que una petición sin sesión no sepa si el lead existe.
	 * @param Mensaje mensaje a registrar
	 * @returns `true` si la verificación del padre autoriza el insert
	 * @throws Rst401 si el token no es válido
	 * @throws Rst400 si faltan datos, el `ilead` no coincide con la ruta, el lead no existe o el email no es un correo del lead
	 */
	protected async verifyInsert(Mensaje: TLeadMensaje): Promise<boolean> {
		await this.verifyAuthorization();
		const ileadRuta: number | undefined = this.ileadRuta;
		if (Mensaje.ilead === undefined && ileadRuta !== undefined) Mensaje.ilead = ileadRuta;
		if (ileadRuta !== undefined && Mensaje.ilead !== ileadRuta)
			throw Rst400(TErr400.other, "El ilead del mensaje no coincide con el de la ruta");
		if (!isBool(Mensaje.ilead)) throw Rst400(TErr400.paramBody, "ilead");
		if (!isBool(Mensaje.email)) throw Rst400(TErr400.paramBody, "email");
		if (!isBool(Mensaje.asunto)) throw Rst400(TErr400.paramBody, "asunto");
		if (Mensaje.fhenvio === undefined) Mensaje.fhenvio = new Date();
		if (!(Mensaje.fhenvio instanceof Date))
			throw Rst400(TErr400.badDate, "fhenvio");

		const [leadRegistrado, correoLead]: [Array<unknown>, Array<unknown>] = await Promise.all([
			this.Conn.lookUp(tablas.ntblLeads, ["ilead"], { ilead: Mensaje.ilead }),
			this.Conn.lookUp(tablas.ntblLeadsCorreos, ["email"], { ilead: Mensaje.ilead, email: Mensaje.email })
		]);
		if (leadRegistrado[0] === null) throw Rst400(TErr400.other, `No existe el lead ${Mensaje.ilead}`);
		if (correoLead[0] === null) throw Rst400(TErr400.other, "El email del mensaje no es un correo registrado del lead");

		if (!isBool(Mensaje.imensaje)) Mensaje.imensaje = await this.Conn.nextVal(secuencias.seqLeadsMensajes);
		else if (await this.exists(Mensaje)) throw Rst400(TErr400.other, `Ya existe un mensaje con imensaje ${Mensaje.imensaje}`);
		return super.verifyInsert(Mensaje);
	}

	/**
	 * Los mensajes no se modifican: corregir uno es registrar otro.
	 * @param _Mensaje mensaje que se intentó modificar
	 * @returns nunca retorna
	 * @throws Rst400 siempre
	 */
	protected async verifyUpdate(_Mensaje: TLeadMensaje): Promise<boolean> {
		throw Rst400(TErr400.other, "Los mensajes enviados no se modifican: registre un mensaje nuevo");
	}

	/**
	 * Los mensajes no se eliminan: son la historia del lead.
	 * @param _Mensaje mensaje que se intentó eliminar
	 * @returns nunca retorna
	 * @throws Rst400 siempre
	 */
	protected async verifyDelete(_Mensaje: TLeadMensaje): Promise<boolean> {
		throw Rst400(TErr400.other, "Los mensajes enviados no se eliminan: son la historia del lead");
	}
}
