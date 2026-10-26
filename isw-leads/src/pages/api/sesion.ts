import type { APIRoute } from "astro";
import { cerrarSesion, iniciarSesion } from "$lib/1.api/Leads_Sesion";

export const prerender = false;

export const POST: APIRoute = iniciarSesion;
export const DELETE: APIRoute = cerrarSesion;
