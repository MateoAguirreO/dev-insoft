import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { TDBTableColumn } from "@ingenieria_insoft/ispbdsql";
import { isBool, lowerCase, TCampo, TErr400, TErr401, TJSONObject, val2Bool, val2Int, val2KeyIApp, val2Str } from "@ingenieria_insoft/ispgen";
import { UUID } from "@ingenieria_insoft/ispnodejs";
import { Rst400, Rst401 } from "@ingenieria_insoft/ispserver";
import { TUsuario } from "../010 Objetos/040_UlUsuario";
import { TSesion } from "../010 Objetos/050_UlSesion";
import { LongitudMinimaClave, tablas } from "../010 UlConst";
import { TSistemaLeads } from "./001_UlSistemaLeads";
import { TSesionController } from "./050_UlSesionServer";

/**
 * Usuarios del API (`seg_usuarios`): CRUD con token, inicio y cierre de sesión. La clave se guarda como hash
 * scrypt con sal propia y ninguna respuesta la entrega.
 */
export class TUsuarioController extends TSistemaLeads<TUsuario> {

	public get nTbl(): tablas { return tablas.ntblSegUsuarios }
	public get klass(): typeof TUsuario { return TUsuario }

	// Eliminar un usuario borra también sus sesiones: el padre las recorre por la columna iusuario.
	protected get tblsDuplicate(): Array<tablas> { return [tablas.ntblSegUsuarios, tablas.ntblSegSesiones] }

	// Igual que en TLeadController: el idnfiltro del base depende de SOUNDEX y no usa su valor.
	protected columnsIdnFilter(): Array<string> { return [] }

	/** Columnas que salen en las respuestas: todas menos `clave`. */
	private get columnasPublicas(): Array<string> {
		return this.columns.map((columna: TDBTableColumn): string => columna.name).filter((nombre: string): boolean => lowerCase(nombre) !== "clave");
	}

	/**
	 * Entrega el usuario sin la columna `clave`.
	 * @returns el SQL del usuario como sub-consulta entre paréntesis
	 */
	public async sqlDetalle(): Promise<string> {
		const A: string = `${this.nTbl}_${UUID().replace(/-/g, "")}`;
		const campos: string = this.columnasPublicas.map((columna: string): string => `${A}.${this.Conn.quoteCol(columna)}`).join(", ");
		return `(SELECT ${campos} FROM ${this.Conn.quoteCol(this.nTbl)} ${A})`;
	}

	/**
	 * El listado tampoco entrega la clave, aunque el consumidor la pida en `campos`.
	 * @param campos columnas que pide el consumidor; si no llega ninguna válida se entregan todas las públicas
	 * @param Alias nombre con el que el listado referencia la tabla de usuarios
	 * @returns la lista de campos del SELECT del listado
	 */
	protected async getFieldsList(campos: Array<TCampo<TUsuario>> | undefined, Alias: string): Promise<string> {
		const pedidas: Array<string> = (campos ?? []).map((campo: TCampo<TUsuario>): string => lowerCase(campo));
		const elegidas: Array<string> = this.columnasPublicas.filter((columna: string): boolean => pedidas.includes(lowerCase(columna)));
		const columnas: Array<string> = isBool(elegidas) ? elegidas : this.columnasPublicas;
		return columnas.map((columna: string): string => `${Alias}.${this.Conn.quoteCol(columna)}`).join(", ");
	}

	/**
	 * Crea el usuario y lo entrega leído de la BD. El padre devuelve el mismo objeto, que en memoria todavía
	 * lleva el hash de la clave; por eso se vuelve a leer.
	 * @param obj usuario a crear, como objeto o JSON
	 * @returns el usuario creado, sin la clave
	 */
	public async insert(obj: TUsuario | TJSONObject): Promise<TUsuario> {
		const Usuario: TUsuario = await super.insert(obj);
		return this.get({ iusuario: Usuario.iusuario });
	}

	/**
	 * Modifica el usuario y lo entrega leído de la BD, por la misma razón de `insert`.
	 * @param obj usuario a modificar, como objeto o JSON
	 * @returns el usuario modificado, sin la clave
	 */
	public async update(obj: TUsuario | TJSONObject): Promise<TUsuario> {
		const Usuario: TUsuario = await super.update(obj);
		return this.get({ iusuario: Usuario.iusuario });
	}

	/**
	 * Valida el usuario nuevo y reemplaza la clave por su hash antes de guardarlo.
	 * El token se valida primero, para que una petición sin sesión no sepa qué usuarios existen.
	 * @param Usuario usuario a crear
	 * @returns `true` si la verificación del padre autoriza el insert
	 * @throws Rst401 si el token no es válido
	 * @throws Rst400 si falta el usuario o el nombre, la clave no cumple o el usuario ya existe
	 */
	protected async verifyInsert(Usuario: TUsuario): Promise<boolean> {
		await this.verifyAuthorization();
		if (!isBool(Usuario.iusuario)) throw Rst400(TErr400.paramBody, "iusuario");
		if (Usuario.iusuario.length > 30) throw Rst400(TErr400.other, "El usuario puede tener máximo 30 caracteres");
		if (!isBool(Usuario.nombre)) throw Rst400(TErr400.paramBody, "nombre");
		this.verifyClave(Usuario.clave);
		if (await this.exists(Usuario)) throw Rst400(TErr400.other, `Ya existe el usuario ${Usuario.iusuario}`);
		Usuario.clave = await this.hashClave(Usuario.clave);
		if (Usuario.bactivo === undefined) Usuario.bactivo = true;
		return super.verifyInsert(Usuario);
	}

	/**
	 * Valida los datos que llegan para modificar el usuario; si llega una clave nueva, se guarda su hash.
	 * @param Usuario usuario a modificar
	 * @returns `true` si la verificación del padre autoriza el update
	 * @throws Rst401 si el token no es válido
	 * @throws Rst400 si el nombre llega vacío o la clave nueva no cumple
	 */
	protected async verifyUpdate(Usuario: TUsuario): Promise<boolean> {
		await this.verifyAuthorization();
		if (Usuario.nombre !== undefined && !isBool(Usuario.nombre)) throw Rst400(TErr400.paramBody, "nombre");
		if (Usuario.clave !== undefined) {
			this.verifyClave(Usuario.clave);
			Usuario.clave = await this.hashClave(Usuario.clave);
		}
		return super.verifyUpdate(Usuario);
	}

	/**
	 * Inicio de sesión, endpoint público: valida usuario y clave, abre la sesión y entrega su JWT.
	 * @param JDatos `usuario` y `clave`; `iapp` e `iequipo` son opcionales e identifican desde dónde se ingresa
	 * @returns el token, su vencimiento y el usuario
	 * @throws Rst400 si falta el usuario o la clave
	 * @throws Rst401 si el usuario no existe, está inactivo o la clave no coincide; el mensaje no dice cuál
	 */
	public async iniciarSesion(JDatos: TJSONObject): Promise<TJSONObject> {
		const iusuario: string = lowerCase(val2Str(JDatos.usuario).trim());
		const clave: string = val2Str(JDatos.clave);
		if (!isBool(iusuario)) throw Rst400(TErr400.paramBody, "usuario");
		if (!isBool(clave)) throw Rst400(TErr400.paramBody, "clave");

		const [hash, bactivo]: Array<unknown> = await this.Conn.lookUp(tablas.ntblSegUsuarios, ["clave", "bactivo"], { iusuario });
		const bClaveCorrecta: boolean = await this.claveCoincide(clave, val2Str(hash));
		if (!bClaveCorrecta || !val2Bool(bactivo)) throw Rst401(TErr401.unauthorized, "Usuario o clave incorrectos");

		const Sesion: TJSONObject = await new TSesionController(this.ctxUser).abrir(iusuario, val2KeyIApp(JDatos.iapp), val2Int(JDatos.iequipo, 0));
		return { ...Sesion, usuario: iusuario };
	}

	/**
	 * Cierra la sesión del token de la petición; el token deja de servir aunque no haya vencido.
	 * @throws Rst401 si el token no es válido
	 */
	public async cerrarSesion(): Promise<void> {
		const Sesion: TSesion = await this.verifyAuthorization();
		await new TSesionController(this.ctxUser).cerrar(Sesion);
	}

	//#region Clave: hash scrypt con sal propia, en el formato `scrypt$<sal>$<hash>` (Base64URL)
	private derivarClave(clave: string, sal: Buffer): Promise<Buffer> {
		return new Promise((resolve, reject): void => {
			scrypt(clave, sal, 64, (error: Error | null, llave: Buffer): void => (error ? reject(error) : resolve(llave)));
		});
	}

	private async hashClave(clave: string): Promise<string> {
		const sal: Buffer = randomBytes(16);
		const hash: Buffer = await this.derivarClave(clave, sal);
		return `scrypt$${sal.toString("base64url")}$${hash.toString("base64url")}`;
	}

	// Si el hash guardado no es válido (usuario inexistente) igual se deriva, para que el tiempo no revele si existe.
	private async claveCoincide(clave: string, hashGuardado: string): Promise<boolean> {
		const [algoritmo, sal, hash]: Array<string> = hashGuardado.split("$");
		const bFormatoValido: boolean = algoritmo === "scrypt" && isBool(sal) && isBool(hash);
		const derivada: Buffer = await this.derivarClave(clave, bFormatoValido ? Buffer.from(sal, "base64url") : randomBytes(16));
		const esperada: Buffer = bFormatoValido ? Buffer.from(hash, "base64url") : Buffer.alloc(derivada.length);
		return bFormatoValido && esperada.length === derivada.length && timingSafeEqual(esperada, derivada);
	}

	private verifyClave(clave: string): void {
		if (!isBool(clave)) throw Rst400(TErr400.paramBody, "clave");
		if (clave.length < LongitudMinimaClave) throw Rst400(TErr400.other, `La clave debe tener al menos ${LongitudMinimaClave} caracteres`);
	}
	//#endregion
}
