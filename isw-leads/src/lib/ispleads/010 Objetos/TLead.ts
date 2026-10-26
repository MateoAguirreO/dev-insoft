// Copia de los objetos del servidor ISS: mantener sincronizada mientras no exista paquete transversal
import { TArray, TObject, val2Bool, val2Int, val2NumericEnum, val2Str, val2TArray } from "@ingenieria_insoft/ispgen";
import { TEstadoLead } from "./TEstadoLead";
import { TLeadCorreo } from "./TLeadCorreo";

// Espeja db/schema/010_leads.sql
export class TLead extends TObject {

	//#region Columnas
	public get ilead(): number { return this.f.ilead }
	public set ilead(value: any) { this.f.ilead = val2Int(value) }

	public get nombre(): string { return this.f.nombre }
	public set nombre(value: any) { this.f.nombre = val2Str(value) }

	public get empresa(): string { return this.f.empresa }
	public set empresa(value: any) { this.f.empresa = val2Str(value) }

	public get cargo(): string { return this.f.cargo }
	public set cargo(value: any) { this.f.cargo = val2Str(value) }

	public get telefono(): string { return this.f.telefono }
	public set telefono(value: any) { this.f.telefono = val2Str(value) }

	public get ciudad(): string { return this.f.ciudad }
	public set ciudad(value: any) { this.f.ciudad = val2Str(value) }

	public get origen(): string { return this.f.origen }
	public set origen(value: any) { this.f.origen = val2Str(value) }

	public get iestado(): TEstadoLead { return this.f.iestado }
	public set iestado(value: any) { this.f.iestado = val2NumericEnum(value, TEstadoLead.none, TEstadoLead) }

	public get observaciones(): string { return this.f.observaciones }
	public set observaciones(value: any) { this.f.observaciones = val2Str(value) }

	public get bactivo(): boolean { return this.f.bactivo }
	public set bactivo(value: any) { this.f.bactivo = val2Bool(value) }
	//#endregion

	//#region Navegación
	// 1:N con leads_correos: la llena el servidor y viaja completa al guardar el lead
	public get correos(): TArray<TLeadCorreo> {
		if (!this.f.correos) this.f.correos = new TArray<TLeadCorreo>();
		return this.f.correos;
	}
	public set correos(value: any) { this.f.correos = val2TArray(value, TLeadCorreo, new TArray()) }
	//#endregion
}
