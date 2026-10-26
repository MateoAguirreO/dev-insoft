import { TObjectBaseMov, val2Date, val2Int, val2Str } from "@ingenieria_insoft/ispgen";

/** Sesión abierta al iniciar sesión (tabla `seg_sesiones`); movimiento: su `isesion` viaja en el JWT como `jti`. */
export class TSesion extends TObjectBaseMov {

	public get isesion(): number { return this.f.isesion }
	public set isesion(value: any) { this.f.isesion = val2Int(value) }

	public get iusuario(): string { return this.f.iusuario }
	public set iusuario(value: any) { this.f.iusuario = val2Str(value) }

	public get fhvence(): Date { return this.f.fhvence }
	public set fhvence(value: any) { this.f.fhvence = val2Date(value) }
}
