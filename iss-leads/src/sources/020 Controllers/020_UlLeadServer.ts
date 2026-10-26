import { TControllerServer } from "@ingenieria_insoft/ispazureutils";
import { TQueryOptions } from "@ingenieria_insoft/ispbdsql";
import { isBool, TCampo, TErr400, TErr404, TFiltroLista, TListaPaginacion } from "@ingenieria_insoft/ispgen";
import { UUID } from "@ingenieria_insoft/ispnodejs";
import { Rst400, Rst404 } from "@ingenieria_insoft/ispserver";
import { TLead } from "../010 Objetos/020_UlLead";
import { secuencias, tablas, TEstadoLead } from "../010 UlConst";
import { iInfoLead } from "../010 UlTypes";
import { TLeadCorreoController } from "./010_UlLeadCorreoServer";
import { TLeadMensajeController } from "./030_UlLeadMensajeServer";

/** Catálogo de leads (`leads`) con sus correos como detalle. Sin auditoría ni seguridad: extiende el base directo. */
export class TLeadController extends TControllerServer<TLead> {

	public get nTbl(): tablas { return tablas.ntblLeads }
	public get klass(): typeof TLead { return TLead }

	// Decisión D2: duplicar (y eliminar) arrastra los correos; recodificar también mueve los mensajes.
	protected get tblsDuplicate(): Array<tablas> { return [tablas.ntblLeads, tablas.ntblLeadsCorreos] }
	protected get tblsRecode(): Array<tablas> { return [tablas.ntblLeads, tablas.ntblLeadsCorreos, tablas.ntblLeadsMensajes] }

	// ISPAzureUtils 2.0.15 arma el idnfiltro con SOUNDEX (en PG exige fuzzystrmatch) y sin usar su valor;
	// sin columnas ese filtro se omite y el listado no depende de la extensión.
	protected columnsIdnFilter(): Array<string> { return [] }

	/**
	 * Entrega el lead con sus correos embebidos en el arreglo `correos`.
	 * @param JData sub-recursos a expandir; `todo` o `correos` incluyen los correos
	 * @returns el SQL del lead como sub-consulta entre paréntesis
	 */
	public async sqlDetalle(JData?: iInfoLead): Promise<string> {
		const A: string = `${this.nTbl}_${UUID().replace(/-/g, "")}`;
		let sql: string = `SELECT ${A}.*`;
		if (JData?.todo || JData?.correos)
			sql += await this.sqlSubArreglo(TLeadCorreoController, "correos", (Z: string): string => `${Z}.ilead=${A}.ilead`);
		if (JData?.todo || JData?.mensajes)
			sql += await this.sqlSubArreglo(TLeadMensajeController, "mensajes", (Z: string): string => `${Z}.ilead=${A}.ilead`);
		return `(${sql} FROM ${this.Conn.quoteCol(this.nTbl)} ${A})`;
	}

	/**
	 * Agrega los correos de cada lead al listado paginado, para que tenga la misma forma del detalle.
	 * @param campos columnas que pide el consumidor; si no llegan se entregan todas
	 * @param Alias nombre con el que el listado referencia la tabla de leads
	 * @returns la lista de campos del SELECT del listado
	 */
	protected async getFieldsList(campos: Array<TCampo<TLead>> | undefined, Alias: string): Promise<string> {
		const campos_lead: string = await super.getFieldsList(campos, Alias);
		const campo_correos: string = await this.sqlSubArreglo(TLeadCorreoController, "correos", (Z: string): string => `${Z}.ilead=${Alias}.ilead`);
		return campos_lead + campo_correos;
	}

	/**
	 * Valida los datos de negocio del lead y de sus correos antes de guardarlos.
	 * @param Lead lead que se va a crear o modificar
	 * @param bInsert indica si es una creación: ahí el nombre es obligatorio aunque no llegue
	 * @throws Rst400 si falta el nombre, el estado no existe, hay un correo vacío o repetido, o más de un principal
	 */
	private verifyDatosLead(Lead: TLead, bInsert: boolean): void {
		if ((bInsert || Lead.nombre !== undefined) && !isBool(Lead.nombre))
			throw Rst400(TErr400.paramBody, "nombre");
		if (Lead.iestado === TEstadoLead.none)
			throw Rst400(TErr400.other, "El estado del lead no es válido: debe ser un valor entre 1 y 5");

		const emails: Array<string> = [];
		let qprincipales: number = 0;
		for (const Correo of Lead.correos) {
			if (!isBool(Correo.email)) throw Rst400(TErr400.other, "Todo correo del lead debe tener email");
			if (emails.includes(Correo.email)) throw Rst400(TErr400.other, "El lead tiene correos repetidos");
			emails.push(Correo.email);
			if (Correo.bprincipal) qprincipales++;
		}
		if (qprincipales > 1) throw Rst400(TErr400.other, "El lead puede tener como máximo un correo principal");
	}

	/**
	 * Valida el lead, le asigna el `ilead` con la secuencia si no llega y completa estado y bandera de activo.
	 * @param Lead lead a crear, con sus correos
	 * @returns `true` si la verificación del padre autoriza el insert
	 * @throws Rst400 si los datos no son válidos o ya existe un lead con el `ilead` indicado
	 */
	protected async verifyInsert(Lead: TLead): Promise<boolean> {
		this.verifyDatosLead(Lead, true);
		if (!isBool(Lead.ilead)) Lead.ilead = await this.Conn.nextVal(secuencias.seqLeads);
		if (Lead.iestado === undefined) Lead.iestado = TEstadoLead.Nuevo;
		if (Lead.bactivo === undefined) Lead.bactivo = true;
		return super.verifyInsert(Lead);
	}

	/**
	 * Valida los datos que llegan para modificar el lead; los correos se reemplazan por los que lleguen.
	 * @param Lead lead a modificar, con sus correos
	 * @returns `true` si la verificación del padre autoriza el update
	 * @throws Rst400 si los datos no son válidos
	 */
	protected async verifyUpdate(Lead: TLead): Promise<boolean> {
		this.verifyDatosLead(Lead, false);
		return super.verifyUpdate(Lead);
	}

	/**
	 * Reemplaza los correos del lead en la misma transacción del insert o del update.
	 * @param Lead lead con los correos que deben quedar registrados
	 * @returns las consultas de borrado e inserción de los correos
	 */
	protected async insertsAsQrysDetails(Lead: TLead): Promise<Array<TQueryOptions>> {
		return Promise.all(new TLeadCorreoController(this.ctxUser).promisesInsertQry(Lead, Lead.correos));
	}

	/**
	 * Incluye el reemplazo de correos aunque no cambie ninguna columna del lead: el padre lo omite en ese caso.
	 * @param Lead lead a modificar, con sus correos
	 * @returns la consulta de actualización con los correos incluidos
	 */
	public async updateAsQry(Lead: TLead): Promise<TQueryOptions> {
		const ObjQuery: TQueryOptions = await super.updateAsQry(Lead);
		if (isBool(ObjQuery.sql)) return ObjQuery;

		const qrysCorreos: Array<TQueryOptions> = await this.updateAsQrysDetails(Lead);
		for (const qryCorreos of qrysCorreos) {
			ObjQuery.sql += qryCorreos.sql;
			ObjQuery.params = [...(ObjQuery.params ?? []), ...(qryCorreos.params ?? [])];
		}
		return ObjQuery;
	}

	/**
	 * Rechaza la eliminación de un lead que no existe o que ya tiene mensajes registrados.
	 * @param Lead lead a eliminar, con su `ilead`
	 * @returns `true` si la verificación del padre autoriza la eliminación
	 * @throws Rst404 si el lead no existe
	 * @throws Rst400 si el lead tiene mensajes: son su historia y no se borran (decisión D2)
	 */
	protected async verifyDelete(Lead: TLead): Promise<boolean> {
		if (!await super.verifyDelete(Lead)) return false;
		const mensajeLead: Array<unknown> = await this.Conn.lookUp(tablas.ntblLeadsMensajes, ["imensaje"], { ilead: Lead.ilead });
		if (mensajeLead[0] !== null)
			throw Rst400(TErr400.other, `El lead ${Lead.ilead} tiene mensajes registrados y no se puede eliminar`);
		return true;
	}
}
