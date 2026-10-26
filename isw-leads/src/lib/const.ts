/** URL del API de Leads cuando el ambiente no define API_URL */
export const UrlApiDefecto: string = "http://localhost:7071/api";

/** Contexto del proxy del mismo origen que reenvía al API (src/pages/api/[...ruta].ts) */
export const RutaProxyApi: string = "api";

/** Milisegundos de espera de cada petición, en el navegador y en el proxy */
export const TimeoutPeticion: number = 30000;

/** A dónde lleva el ingreso cuando no hay ruta de retorno, y dónde se inicia sesión */
export const RutaInicio: string = "/leads";
export const RutaLogin: string = "/login";

/** Cookie httpOnly con el token de la sesión: solo la lee el servidor SSR, nunca el JavaScript del navegador */
export const CookieSesion: string = "istoken";

/** Aplicación (TIS_IApp de ISPGen) con la que la web abre sus sesiones en el API */
export const IAppWeb: string = "WebLogin";

/** Longitud máxima del usuario (seg_usuarios.iusuario) */
export const LongitudUsuario: number = 30;

export const LeadsPorPagina: number = 20;
/** Leads que se revisan en una búsqueda local mientras el API no filtre por columnas */
export const LimiteBusquedaLocal: number = 1000;
export const MensajesPorPagina: number = 20;

/** Longitudes de las columnas en db/schema: nombre, empresa y email; cargo, teléfono, ciudad y origen; asunto */
export const LongitudTextoLargo: number = 100;
export const LongitudTextoCorto: number = 50;
export const LongitudAsunto: number = 255;

export type TMensajeError = "sinConexion" | "sinAutorizacion" | "sesionVencida" | "apiNoDisponible" | "servidor" | "rutaNoEncontrada";

/** Textos que ve el usuario cuando algo falla fuera de su control */
export const MensajesError: Record<TMensajeError, string> = {
	sinConexion: "No logramos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.",
	sesionVencida: "Tu sesión terminó. Inicia sesión de nuevo para continuar.",
	sinAutorizacion: "El servicio de leads no aceptó la solicitud por falta de autorización. Pide a tu administrador que revise la configuración.",
	apiNoDisponible: "El servicio de leads no está disponible en este momento. Inténtalo de nuevo en unos minutos.",
	servidor: "Tuvimos un problema al procesar tu solicitud. Inténtalo de nuevo en unos minutos.",
	rutaNoEncontrada: "La ruta que pediste no existe.",
};

export type TAviso = "creado" | "duplicado" | "recodificado" | "eliminado";

/** Confirmaciones que se muestran al llegar a una página después de una acción (parámetro ?aviso=) */
export const Avisos: Record<TAviso, string> = {
	creado: "¡Listo! Guardamos el nuevo lead.",
	duplicado: "¡Listo! Este es el lead que acabas de duplicar.",
	recodificado: "¡Listo! El lead ya tiene su nuevo código.",
	eliminado: "Eliminamos el lead.",
};
