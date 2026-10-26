import { lowerCase, TObjectBase, val2Bool, val2Str } from "@ingenieria_insoft/ispgen";

/** Usuario que inicia sesión en el API (tabla `seg_usuarios`); tabla de datos: auditoría de creación y modificación. */
export class TUsuario extends TObjectBase {

	// Se normaliza a minúscula y sin espacios: el inicio de sesión no distingue mayúsculas.
	public get iusuario(): string { return this.f.iusuario }
	public set iusuario(value: any) { this.f.iusuario = lowerCase(val2Str(value).trim()) }

	public get nombre(): string { return this.f.nombre }
	public set nombre(value: any) { this.f.nombre = val2Str(value) }

	// Hash scrypt de la clave: nunca se guarda ni se entrega la clave en texto plano.
	public get clave(): string { return this.f.clave }
	public set clave(value: any) { this.f.clave = val2Str(value) }

	public get bactivo(): boolean { return this.f.bactivo }
	public set bactivo(value: any) { this.f.bactivo = val2Bool(value) }
}
