/// <reference types="astro/client" />

/**
 * Variables del Worker (en local salen de .dev.vars). Son solo del servidor: ninguna lleva prefijo PUBLIC_,
 * así que nunca llegan al navegador.
 */
interface Env {
	/** URL base del API de Leads; sin valor se usa UrlApiDefecto de src/lib/const.ts */
	API_URL?: string;
	/** Token que el proxy envía como `Authorization: Bearer`; sin valor no se envía el header */
	API_TOKEN?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
