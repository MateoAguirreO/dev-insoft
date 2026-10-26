import { lowerCase, TObject, val2Bool, val2Int, val2Str } from "@ingenieria_insoft/ispgen";

/** Correo de un lead (tabla `leads_correos`, detalle de `leads`); viaja dentro del lead. */
export class TLeadCorreo extends TObject {

	public get ilead(): number { return this.f.ilead }
	public set ilead(value: any) { this.f.ilead = val2Int(value) }

	// Se normaliza a minúscula y sin espacios: es parte de la llave y se compara con el de los mensajes.
	public get email(): string { return this.f.email }
	public set email(value: any) { this.f.email = lowerCase(val2Str(value).trim()) }

	public get bprincipal(): boolean { return this.f.bprincipal }
	public set bprincipal(value: any) { this.f.bprincipal = val2Bool(value) }
}
