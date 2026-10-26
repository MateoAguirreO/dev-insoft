import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	//Cada ruta se resuelve en el Worker de Cloudflare; los estáticos los sirve Cloudflare antes de llegar a él
	output: "server",
	integrations: [
		svelte({
			configFile: "./config/svelte.config.js",
			extensions: [".svelte"],
			emitCss: true,
		}),
	],
	adapter: cloudflare({
		//En desarrollo expone las variables de .dev.vars en Astro.locals.runtime.env, igual que en el Worker
		platformProxy: { enabled: true },
		//El runtime de Cloudflare no trae sharp: las imágenes locales se optimizan al construir
		imageService: "compile",
	}),
	//Puerto de `astro dev` y `astro preview`; el servidor de Leads permite CORS desde este origen
	server: { port: Number(process.env.PORT ?? 4321) },
	vite: {
		plugins: [tailwindcss()],
	},
});
