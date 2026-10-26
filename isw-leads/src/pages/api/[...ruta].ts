import type { APIRoute } from "astro";
import { reenviarAlApi } from "$lib/1.api/Leads_Proxy";

export const prerender = false;

export const GET: APIRoute = reenviarAlApi;
export const POST: APIRoute = reenviarAlApi;
export const PUT: APIRoute = reenviarAlApi;
export const DELETE: APIRoute = reenviarAlApi;
