import { TControllerServer } from "@ingenieria_insoft/ispazureutils";
import { isBool, lowerCase, TErr401, TIS_IApp, TJSONObject, TMensajesVerificacion, TObject, TObjectBase, TObjectBaseMov, val2Int, val2KeyIApp, val2Str, val2TObject } from "@ingenieria_insoft/ispgen";
import { Rst401 } from "@ingenieria_insoft/ispserver";
import { TSesion } from "../010 Objetos/050_UlSesion";
import { TSesionController } from "./050_UlSesionServer";

type TAccionVerificacion = "insert" | "update" | "get" | "delete";

/**
 * Clase intermedia de los controladores de Leads (skill 04): exige el JWT en cada operación, estampa la
 * auditoría del Modelo B y entrega los mapas de auditoría de duplicar y recodificar.
 */
export abstract class TSistemaLeads<T extends TObject> extends TControllerServer<T> {

	/** Columnas de auditoría del Modelo B: las pone el servidor, nunca el cliente. */
	private static readonly columnasAuditoria: Array<string> = ["iusuariocre", "iappcre", "iequipocre", "ipcre", "fhcre", "iusuarioult", "iappult", "iequipoult", "ipult", "fhult"];

	protected get useCache(): boolean { return false }

	public abstract get nTbl(): string;
	public abstract get klass(): typeof TObject;

	//#region Autenticación
	public get auth(): TSesion { return this.f.auth }
	public set auth(Sesion: TSesion) { this.f.auth = val2TObject(Sesion, TSesion) }

	public get iusuario(): string { return val2Str(this.auth?.iusuario) }
	public get iapp(): keyof typeof TIS_IApp { return val2KeyIApp(this.auth?.iappcre) }
	public get iequipo(): number { return val2Int(this.auth?.iequipocre, 0) }
	public get ip(): string { return val2Str(this.ctxUser.ip, "127.0.0.1") }

	/**
	 * Obtiene el token: el explícito, el de los parámetros `authorization`/`auth` o el del header `Authorization`.
	 * @param token token recibido directamente, si lo hay
	 * @returns el token encontrado o una cadena vacía
	 */
	protected verifyToken(token?: string): string {
		if (isBool(token)) return val2Str(token);
		const tokenParametros: string = val2Str(this.params?.authorization ?? this.params?.auth);
		if (isBool(tokenParametros)) return tokenParametros;
		const partesHeader: Array<string> = val2Str(this.headers?.authorization).split(" ");
		return val2Str(partesHeader.pop());
	}

	/**
	 * Valida el JWT contra su sesión en la BD y la guarda en `auth` para no revalidarla en la misma petición.
	 * @param token token explícito; si no llega, se busca en parámetros y headers
	 * @returns la sesión del token
	 * @throws Rst401 si no hay token, la firma no es válida, venció, la sesión se cerró o el usuario está inactivo
	 */
	public async verifyAuthorization(token?: string): Promise<TSesion> {
		if (isBool(this.auth)) return this.auth;
		const tokenPeticion: string = this.verifyToken(token);
		if (!isBool(tokenPeticion)) throw Rst401(TErr401.noauthorization, "No se ha definido la llave de autorización");
		this.auth = await new TSesionController(this.ctxUser).verificarToken(tokenPeticion);
		return this.auth;
	}
	//#endregion

	//#region Auditoría: insert y update no la autocompletan, se estampa antes de delegar al padre
	private estamparAuditoriaCreacion(Obj: TObjectBaseMov): void {
		Obj.iusuariocre = this.iusuario;
		Obj.iappcre = this.iapp;
		Obj.iequipocre = this.iequipo;
		Obj.ipcre = this.ip;
		Obj.fhcre = new Date();
	}

	private estamparAuditoriaModificacion(Obj: TObjectBase): void {
		Obj.iusuarioult = this.iusuario;
		Obj.iappult = this.iapp;
		Obj.iequipoult = this.iequipo;
		Obj.ipult = this.ip;
		Obj.fhult = new Date();
	}

	private async verifyAction(Obj: T, accion: TAccionVerificacion): Promise<boolean> {
		await this.verifyAuthorization();
		const bEscritura: boolean = accion === "insert" || accion === "update";
		if (accion === "insert" && Obj instanceof TObjectBaseMov) this.estamparAuditoriaCreacion(Obj);
		if (bEscritura && Obj instanceof TObjectBase) this.estamparAuditoriaModificacion(Obj);
		switch (accion) {
			case "insert": return super.verifyInsert(Obj);
			case "update": return super.verifyUpdate(Obj);
			case "delete": return super.verifyDelete(Obj);
			case "get": return super.verifyGet(Obj);
		}
	}

	protected verifyInsert(Obj: T): Promise<boolean> { return this.verifyAction(Obj, "insert") }
	protected verifyUpdate(Obj: T): Promise<boolean> { return this.verifyAction(Obj, "update") }
	protected verifyDelete(Obj: T): Promise<boolean> { return this.verifyAction(Obj, "delete") }
	protected verifyGet(Obj: T): Promise<boolean> { return this.verifyAction(Obj, "get") }

	// La plantilla solo protege insert, update, delete y get; listar, duplicar, recodificar y consolidar también piden token.
	protected async verifyList(Obj?: T): Promise<boolean> {
		await this.verifyAuthorization();
		return super.verifyList(Obj);
	}

	protected async verifyDuplicar(Obj: T, ObjNew: T): Promise<boolean> {
		await this.verifyAuthorization();
		return super.verifyDuplicar(Obj, ObjNew);
	}

	protected async verifyRecode(Obj: T, ObjNew: T): Promise<boolean> {
		await this.verifyAuthorization();
		return super.verifyRecode(Obj, ObjNew);
	}

	protected async verifyConsolidate(Obj: T, ObjNew: T): Promise<boolean> {
		await this.verifyAuthorization();
		return super.verifyConsolidate(Obj, ObjNew);
	}

	/**
	 * Verifica el recurso exigiendo el token. El helper de rutas llama a `verify()` directo, y ahí no se lanza
	 * `Rst401` porque el padre lo usa por dentro (skill 04), así que la ruta de verificar usa este método.
	 * @param Obj recurso a verificar
	 * @returns los mensajes de la verificación
	 * @throws Rst401 si el token no es válido
	 */
	public async verificar(Obj: T): Promise<TMensajesVerificacion> {
		await this.verifyAuthorization();
		return this.verify(Obj);
	}

	/**
	 * Descarta la auditoría que mande el cliente antes de modificar: la de creación no cambia y la de
	 * modificación la estampa `verifyAction`.
	 * @param obj recurso a modificar, como objeto o JSON
	 * @returns el recurso modificado
	 */
	public async update(obj: T | TJSONObject): Promise<T> {
		const JObj: TJSONObject = (obj instanceof TObject) ? obj.toJSON() : { ...obj };
		for (const campo of Object.keys(JObj))
			if (TSistemaLeads.columnasAuditoria.includes(lowerCase(campo))) delete JObj[campo];
		return super.update(JObj);
	}

	// Mapas que solo usan duplicate, recode y consolidate; el literal CURRENT_TIMESTAMP se emite como función SQL.
	protected camposAuditoriaInsert(): Record<Uppercase<string>, any> {
		return { IUSUARIOCRE: this.iusuario, IAPPCRE: this.iapp, IEQUIPOCRE: this.iequipo, IPCRE: this.ip, FHCRE: "CURRENT_TIMESTAMP" };
	}

	protected camposAuditoriaUpdate(): Record<Uppercase<string>, any> {
		return { IUSUARIOULT: this.iusuario, IAPPULT: this.iapp, IEQUIPOULT: this.iequipo, IPULT: this.ip, FHULT: "CURRENT_TIMESTAMP" };
	}
	//#endregion
}
