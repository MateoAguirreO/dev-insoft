import { TError, isBool, val2Str } from "@ingenieria_insoft/ispgen";
import { Avisos, type TAviso } from "$lib/const";

/**
 * Texto de error para el usuario. Los errores del servicio y las validaciones ya llegan en lenguaje claro;
 * cualquier otro (fallas de programación, respuestas inesperadas) se reemplaza por el mensaje por defecto.
 */
export function mensajeError(error: unknown, mensajeDefecto: string): string {
	const bErrorPropio: boolean = error instanceof TError || (error instanceof Error && error.constructor === Error);
	if (bErrorPropio && isBool((error as Error).message)) return (error as Error).message;
	return mensajeDefecto;
}

export function formatoFechaHora(fecha: Date | undefined): string {
	if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return "—";
	return fecha.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

/** Navega a una ruta del sitio y deja pendiente una confirmación para la página de destino */
export function navegarConAviso(ruta: string, aviso: TAviso, bReemplazar: boolean = false): void {
	const destino: string = `${ruta}?aviso=${aviso}`;
	if (bReemplazar) window.location.replace(destino);
	else window.location.assign(destino);
}

/** Entrega la confirmación que dejó la página anterior y la quita de la URL */
export function tomarAviso(): string {
	const url: URL = new URL(window.location.href);
	const aviso: string = val2Str(url.searchParams.get("aviso"));
	if (!isBool(aviso)) return "";
	url.searchParams.delete("aviso");
	window.history.replaceState(null, "", url.pathname + url.search);
	return aviso in Avisos ? Avisos[aviso as TAviso] : "";
}
