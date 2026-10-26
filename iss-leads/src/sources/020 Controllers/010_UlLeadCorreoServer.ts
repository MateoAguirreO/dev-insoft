import { TControllerServer } from "@ingenieria_insoft/ispazureutils";
import { TDBParam, TQueryOptions } from "@ingenieria_insoft/ispbdsql";
import { TArray } from "@ingenieria_insoft/ispgen";
import { TLeadCorreo } from "../010 Objetos/010_UlLeadCorreo";
import { TLead } from "../010 Objetos/020_UlLead";
import { tablas } from "../010 UlConst";

/** Correos del lead (`leads_correos`). No se exponen por HTTP: se guardan y se entregan dentro del lead. */
export class TLeadCorreoController extends TControllerServer<TLeadCorreo> {

	public get nTbl(): tablas { return tablas.ntblLeadsCorreos }
	public get klass(): typeof TLeadCorreo { return TLeadCorreo }

	/**
	 * Arma las consultas que reemplazan los correos del lead: borra los que tiene y crea los que llegan.
	 * @param Lead lead dueño de los correos, con el `ilead` ya asignado
	 * @param Correos correos que deben quedar registrados para el lead
	 * @returns promesas de `TQueryOptions` para concatenar en la transacción del lead
	 */
	public promisesInsertQry(Lead: TLead, Correos: TArray<TLeadCorreo>): Array<Promise<TQueryOptions>> {
		const paramLead: TDBParam = { name: `ilead_${this.UUID}`, hint: "entero", value: Lead.ilead };
		const sqlBorrar: string = `;DELETE FROM ${this.Conn.quoteCol(this.nTbl)} WHERE ${this.Conn.quoteCol("ilead")}=@${paramLead.name}`;
		const result: Array<Promise<TQueryOptions>> = [Promise.resolve({ sql: sqlBorrar, params: [paramLead] })];
		for (const Correo of Correos) {
			Correo.ilead = Lead.ilead;
			result.push(this.insertAsQry(Correo));
		}
		return result;
	}
}
