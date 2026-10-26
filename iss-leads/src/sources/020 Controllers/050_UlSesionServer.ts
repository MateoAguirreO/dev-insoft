import { TControllerServer } from "@ingenieria_insoft/ispazureutils";
import { isBool, TErr401, TErr500, TIS_IApp, TJSONObject, val2Bool, val2Int, val2Str } from "@ingenieria_insoft/ispgen";
import { varEnv } from "@ingenieria_insoft/ispnodejs";
import { Rst401, Rst500 } from "@ingenieria_insoft/ispserver";
import { JwtPayload, sign as firmarToken, TokenExpiredError, verify as verificarFirma } from "jsonwebtoken";
import { TSesion } from "../010 Objetos/050_UlSesion";
import { HorasVigenciaSesion, secuencias, tablas } from "../010 UlConst";

/** Sesiones del API (`seg_sesiones`). Sin seguridad propia: es la que usa TSistemaLeads para validar el token. */
export class TSesionController extends TControllerServer<TSesion> {

	public get nTbl(): tablas { return tablas.ntblSegSesiones }
	public get klass(): typeof TSesion { return TSesion }

	/** Llave con la que se firman y verifican los JWT: la variable `JWT_SECRET` (local.settings.json en local). */
	public static get llaveJWT(): string {
		const llave: string = val2Str(varEnv("JWT_SECRET"));
		if (!isBool(llave)) throw Rst500(TErr500.none, "No se ha configurado la llave de firma de los tokens");
		return llave;
	}

	/**
	 * Verifica la firma y el vencimiento del JWT y que su sesión siga abierta y vigente en la BD.
	 * @param token JWT que envía el consumidor
	 * @returns la sesión del token, leída de la BD
	 * @throws Rst401 si el token no es válido, venció, su sesión no existe o el usuario está inactivo
	 */
	public async verificarToken(token: string): Promise<TSesion> {
		const llave: string = TSesionController.llaveJWT;
		let Payload: string | JwtPayload;
		try {
			Payload = verificarFirma(token, llave, { algorithms: ["HS256"] });
		} catch (error) {
			if (error instanceof TokenExpiredError) throw Rst401(TErr401.other, "El token ha expirado, por favor solicite uno nuevo");
			throw Rst401(TErr401.malformed, "Token no válido");
		}
		if (typeof Payload !== "object" || !isBool(Payload.jti)) throw Rst401(TErr401.malformed, "Token no válido");

		// El dueño y el vencimiento se toman de la sesión guardada: cerrarla en la BD invalida el token.
		const Sesion: TSesion | false = await this.tryGet({ isesion: val2Int(Payload.jti) });
		if (!Sesion || Sesion.iusuario !== val2Str(Payload.usuario))
			throw Rst401(TErr401.unauthorized, "La sesión no existe o ya fue cerrada");
		if (!(Sesion.fhvence instanceof Date) || Sesion.fhvence.getTime() <= Date.now())
			throw Rst401(TErr401.other, "El token ha expirado, por favor solicite uno nuevo");

		const [bactivo]: Array<unknown> = await this.Conn.lookUp(tablas.ntblSegUsuarios, ["bactivo"], { iusuario: Sesion.iusuario });
		if (!val2Bool(bactivo)) throw Rst401(TErr401.unauthorized, "Usuario no autorizado");
		return Sesion;
	}

	/**
	 * Abre una sesión para un usuario ya autenticado y firma su JWT, con el `isesion` como `jti`.
	 * @param iusuario usuario que inicia sesión
	 * @param iapp aplicación desde la que inicia sesión
	 * @param iequipo equipo desde el que inicia sesión
	 * @returns el token y su vencimiento
	 */
	public async abrir(iusuario: string, iapp: keyof typeof TIS_IApp, iequipo: number): Promise<TJSONObject> {
		const Sesion: TSesion = TSesion.JSONToObject<TSesion>({
			isesion: await this.Conn.nextVal(secuencias.seqSegSesiones),
			iusuario,
			fhvence: new Date(Date.now() + HorasVigenciaSesion * 3600000)
		});
		// Todavía no hay token: la auditoría de creación es la del propio inicio de sesión.
		Sesion.iusuariocre = iusuario;
		Sesion.iappcre = iapp;
		Sesion.iequipocre = iequipo;
		Sesion.ipcre = val2Str(this.ctxUser.ip, "127.0.0.1");
		Sesion.fhcre = new Date();
		await this.insert(Sesion);

		const token: string = firmarToken({ usuario: iusuario, iapp, iequipo }, TSesionController.llaveJWT, {
			algorithm: "HS256",
			expiresIn: HorasVigenciaSesion * 3600,
			jwtid: String(Sesion.isesion)
		});
		return { token, fhvence: Sesion.fhvence };
	}

	/**
	 * Cierra la sesión borrando su fila: su token deja de servir aunque no haya vencido.
	 * @param Sesion sesión del token verificado
	 */
	public async cerrar(Sesion: TSesion): Promise<void> {
		await this.delete(Sesion);
	}
}
