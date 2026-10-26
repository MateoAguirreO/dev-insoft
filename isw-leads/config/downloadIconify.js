import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { downloadIconifyIcons } from "@ingenieria_insoft/ispsveltecomponents/download-iconify";

// La API de Iconify responde 404 a `prefijo:nombre.svg`, que es como arma la URL ispsveltecomponents 2.0.33;
// se reescribe a `prefijo/nombre.svg`. Quitar cuando el paquete lo corrija.
const httpsGetOriginal = https.get;
https.get = function (url, ...resto) {
	const urlIcono = typeof url === "string" ? url.replace(/^(https:\/\/api\.iconify\.design\/[a-z0-9-]+):/, "$1/") : url;
	return httpsGetOriginal.call(this, urlIcono, ...resto);
};

// Raiz del proyecto (este archivo esta en config/)
const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");

const scanDirs = [path.join(PKG_ROOT, "src")];
const insoftRoot = path.join(PKG_ROOT, "node_modules", "@ingenieria_insoft");
if (fs.existsSync(insoftRoot)) {
	scanDirs.push(insoftRoot);
}

try {
	await downloadIconifyIcons({
		outputDir: path.join(PKG_ROOT, "public", "icons", "iconify"),
		projectRoot: PKG_ROOT,
		scanDirs,
	});
	process.exit(0);
} catch (e) {
	console.error(e);
	process.exit(1);
}
