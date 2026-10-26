import { lowerCase, TObjectBaseMov, val2Date, val2Int, val2Str } from "@ingenieria_insoft/ispgen";

/** Mensaje enviado a un lead (tabla `leads_mensajes`); es un movimiento: se registra una sola vez. */
export class TLeadMensaje extends TObjectBaseMov {

	public get imensaje(): number { return this.f.imensaje }
	public set imensaje(value: any) { this.f.imensaje = val2Int(value) }

	public get ilead(): number { return this.f.ilead }
	public set ilead(value: any) { this.f.ilead = val2Int(value) }

	// Copia histórica del destinatario; se normaliza igual que en TLeadCorreo para poder compararlos.
	public get email(): string { return this.f.email }
	public set email(value: any) { this.f.email = lowerCase(val2Str(value).trim()) }

	public get asunto(): string { return this.f.asunto }
	public set asunto(value: any) { this.f.asunto = val2Str(value) }

	public get cuerpo(): string { return this.f.cuerpo }
	public set cuerpo(value: any) { this.f.cuerpo = val2Str(value) }

	// Un valor nulo se ignora para que el controlador ponga la fecha actual; uno inválido queda en null.
	public get fhenvio(): Date { return this.f.fhenvio }
	public set fhenvio(value: any) { if (![null, undefined].includes(value)) this.f.fhenvio = val2Date(value) }
}
