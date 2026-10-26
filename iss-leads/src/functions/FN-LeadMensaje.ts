import { registerCatalogoGenAzureFunction } from "@ingenieria_insoft/ispazureutils";
import { TLeadMensaje } from "../sources/010 Objetos/030_UlLeadMensaje";
import { TLeadMensajeController } from "../sources/020 Controllers/030_UlLeadMensajeServer";

// Sub-recurso del lead y movimiento: solo se registra, se lista por lead y se consulta (Ficha de proyecto).
// {imensaje:long} separa obtener de listar, que tienen la misma forma.
registerCatalogoGenAzureFunction(TLeadMensajeController, TLeadMensaje, {
	pk: ["imensaje"],
	omitir: ["Modificar", "Eliminar", "Verificar", "Duplicar", "Recodificar", "Consolidar"],
	paths: {
		obtener: "leads/{ilead:long}/mensajes/{imensaje:long}",
		insertar: "leads/{ilead:long}/mensajes",
		listar: "leads/{ilead:long}/mensajes/{datosfiltro?}"
	}
});
