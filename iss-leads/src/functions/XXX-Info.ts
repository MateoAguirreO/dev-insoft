import { registerInfoServerAzureFunction } from "@ingenieria_insoft/ispazureutils";

// Health-check estándar (OPTIONS anónimo): versión del servicio y estado de la BD indicada en `namedb`.
registerInfoServerAzureFunction();
