// Copia de los objetos del servidor ISS: mantener sincronizada mientras no exista paquete transversal
// `none` es el valor que deja el conversor cuando llega un estado que no existe; SelectEnum no lo muestra
export enum TEstadoLead {
	none = 0,
	Nuevo = 1,
	Contactado = 2,
	Calificado = 3,
	Descartado = 4,
	Convertido = 5,
}
