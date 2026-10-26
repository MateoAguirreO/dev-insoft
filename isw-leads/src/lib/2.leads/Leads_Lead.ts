import {
	TArray, TError, TObject, TRequestError, TResourceNotFound, isBool, lowerCase, removeSpecialCharacters, val2JSON, val2Str,
	type TJSONObject, type TListaPaginacion, type TReqResponse
} from "@ingenieria_insoft/ispgen";
import type { ICtxActionDuplicar, ICtxActionEliminar, ICtxActionRecodificar } from "@ingenieria_insoft/ispsveltecomponents";
import { TLeadsBaseClient } from "$lib/1.api/Leads_ClienteBase";
import { LeadsPorPagina, LimiteBusquedaLocal, MensajesError } from "$lib/const";
import { TEstadoLead } from "$lib/ispleads/010 Objetos/TEstadoLead";
import { TLead } from "$lib/ispleads/010 Objetos/TLead";

const FormatoCorreo: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controlador del lead: listar, obtener, crear, modificar, eliminar, duplicar y recodificar.
 * Las acciones `act*` son las que invocan los modales de ispsveltecomponents.
 */
export class TLeadsClient extends TLeadsBaseClient<TLead>
	implements ICtxActionEliminar<TLead>, ICtxActionDuplicar<TLead>, ICtxActionRecodificar<TLead> {

	public get klass(): typeof TObject { return TLead }
	public get primaryKeys(): Array<keyof TLead> { return ["ilead"] }
	public get entrie(): string { return "Lead" }
	public get entries(): string { return "Leads" }
	public get labelPk(): string { return "Código del lead" }
	public get sizePk(): number { return 15 }

	public get nEndPoint(): string { return "leads" }
	public get nEndPointListado(): string { return "leads" }
	public get nEndPointVerificar(): string { return "leads/:ilead/verificar" }
	public get nEndPointDuplicar(): string { return "leads/:ilead/duplicar" }
	public get nEndPointRecodificar(): string { return "leads/:ilead/recodificar" }

	// Sin filtros la paginación es del servicio. Con filtros se buscan localmente: el listado del API aún
	// no filtra por columnas, así que se trae un bloque de hasta LimiteBusquedaLocal leads y se pagina aquí
	public async Lista(texto: string, iestado: number, pagina: number): Promise<TListaPaginacion<TLead>> {
		const busqueda: string = this.normalizar(texto);
		if (!isBool(busqueda) && !(iestado > 0))
			return this.list({ pagina, qregistros: LeadsPorPagina }, this.timeout);

		const Bloque: TListaPaginacion<TLead> = await this.list({ pagina: 1, qregistros: LimiteBusquedaLocal }, this.timeout);
		const coincidencias: Array<TLead> = [];
		for (const Lead of Bloque.datos) {
			const bTexto: boolean = !isBool(busqueda) || this.normalizar(`${Lead.nombre} ${Lead.empresa}`).includes(busqueda);
			const bEstado: boolean = !(iestado > 0) || Lead.iestado === iestado;
			if (bTexto && bEstado) coincidencias.push(Lead);
		}
		const totalpaginas: number = Math.max(1, Math.ceil(coincidencias.length / LeadsPorPagina));
		const paginaValida: number = Math.min(Math.max(1, pagina), totalpaginas);
		const inicio: number = (paginaValida - 1) * LeadsPorPagina;
		return {
			pagina: paginaValida,
			qregistros: LeadsPorPagina,
			totalregistros: coincidencias.length,
			totalpaginas,
			datos: new TArray<TLead>(coincidencias.slice(inicio, inicio + LeadsPorPagina)),
		};
	}

	// El 404 del paquete base es técnico; se cambia por uno que el usuario entienda
	public async Obtener(ilead: number): Promise<TLead> {
		try {
			return await this.get({ ilead }, this.timeout);
		} catch (error) {
			if (error instanceof TResourceNotFound)
				throw new TResourceNotFound(`No encontramos el lead ${ilead}. Puede que lo hayan eliminado o que ahora tenga otro código.`);
			throw error;
		}
	}

	public Guardar(Obj: TLead, bNuevo: boolean): Promise<TLead> {
		this.validar(Obj);
		return bNuevo ? this.insert(Obj, this.timeout) : this.update(Obj, this.timeout);
	}

	public actEliminar(Obj: TLead | TJSONObject): Promise<TLead> {
		return this.delete(Obj, this.timeout);
	}

	public actDuplicar(Obj: TLead | TJSONObject, ObjNew: TLead | TJSONObject): Promise<TLead> {
		return this.duplicate(Obj, ObjNew, this.timeout);
	}

	public actRecodificar(Obj: TLead | TJSONObject, ObjNew: TLead | TJSONObject): Promise<TLead> {
		return this.recode(Obj, ObjNew, this.timeout);
	}

	// El contrato recibe solo {"ilead": nuevo}; el método heredado enviaría el lead completo
	public async duplicate(obj: TLead | TJSONObject, objNew: TLead | TJSONObject, timeOut: number = this.timeout): Promise<TLead> {
		const Obj: TLead = this.aLead(obj);
		const ObjNew: TLead = this.aLead(objNew);
		await this.verifyDuplicar(Obj, ObjNew);
		return this.enviarCodigoNuevo("POST", this.pathVariables(this.nEndPointDuplicar, Obj, true), ObjNew, timeOut);
	}

	public async recode(obj: TLead | TJSONObject, objNew: TLead | TJSONObject, timeOut: number = this.timeout): Promise<TLead> {
		const Obj: TLead = this.aLead(obj);
		const ObjNew: TLead = this.aLead(objNew);
		await this.verifyRecode(Obj, ObjNew);
		return this.enviarCodigoNuevo("PUT", this.pathVariables(this.nEndPointRecodificar, Obj, true), ObjNew, timeOut);
	}

	// Minúsculas y sin tildes, para que «Gómez» y «gomez» coincidan
	protected normalizar(texto: string): string {
		return removeSpecialCharacters(lowerCase(val2Str(texto).trim()));
	}

	protected aLead(obj: TLead | TJSONObject): TLead {
		return obj instanceof TLead ? obj : TLead.JSONToObject<TLead>(obj);
	}

	protected async enviarCodigoNuevo(metodo: "POST" | "PUT", path: string, ObjNew: TLead, timeOut: number): Promise<TLead> {
		if (!(ObjNew.ilead > 0)) throw new TRequestError("Escribe un código válido: un número entero mayor que cero.");
		const cuerpo: string = JSON.stringify({ ilead: ObjNew.ilead });
		const res: TReqResponse = await this.request(metodo, path, cuerpo, timeOut);
		const resJSON: TJSONObject = val2JSON(res.responseText, {});
		if (!this.verifyResponse(res)) throw new TError(val2Str(val2JSON(resJSON.encabezado, {}).mensaje, MensajesError.servidor));
		ObjNew.loadFromJSON(val2JSON(val2JSON(resJSON.respuesta, {}).datos, {}));
		return ObjNew;
	}

	// Reglas de negocio que se pueden anticipar antes de ir al servicio
	protected validar(Obj: TLead): void {
		Obj.nombre = val2Str(Obj.nombre).trim();
		if (!isBool(Obj.nombre)) throw new TRequestError("Escribe el nombre del lead.");
		if (Obj.iestado === TEstadoLead.none) throw new TRequestError("Elige el estado del lead.");
		const correosVistos: Array<string> = [];
		let qprincipales: number = 0;
		for (const Correo of Obj.correos) {
			if (!isBool(Correo.email)) throw new TRequestError("Hay un correo vacío: escríbelo o quita esa fila.");
			if (!FormatoCorreo.test(Correo.email))
				throw new TRequestError(`Revisa el correo «${Correo.email}»: no tiene un formato válido.`);
			if (correosVistos.includes(Correo.email)) throw new TRequestError(`El correo ${Correo.email} está repetido.`);
			correosVistos.push(Correo.email);
			if (Correo.bprincipal) qprincipales++;
		}
		if (qprincipales > 1) throw new TRequestError("Marca solo un correo como principal.");
	}
}
