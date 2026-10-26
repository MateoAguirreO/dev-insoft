import { registerCatalogoGenAzureFunction } from "@ingenieria_insoft/ispazureutils";
import { TLead } from "../sources/010 Objetos/020_UlLead";
import { TLeadController } from "../sources/020 Controllers/020_UlLeadServer";
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  TMensajesVerificacion,
  TResponseData,
} from "@ingenieria_insoft/ispgen";
import { RstError, RstExitosa } from "@ingenieria_insoft/ispserver";

// Consolidar se omite: ISPAzureUtils arma ese SQL solo para MS-SQL (ver Ficha de proyecto, "No incluye").
// {ilead:long} separa "leads/5" (obtener) de "leads/<base64url>" (listar), que tienen la misma forma.
registerCatalogoGenAzureFunction(TLeadController, TLead, {
  pk: ["ilead"],
  nrecurso: "lead",
  nrecursos: "leads",
  omitir: ["Consolidar", "Verificar"],
  paths: {
    obtener: "leads/{ilead:long}",
    insertar: "leads",
    modificar: "leads/{ilead:long}",
    eliminar: "leads/{ilead:long}",
    listar: "leads/{datosfiltro?}",
    duplicar: "leads/{ilead:long}/duplicar",
    recodificar: "leads/{ilead:long}/recodificar",
  },
});

//helper llama a verify(), que no exige el token; verificar() sí lo exige.
app.get("LEAD_VERIFY_HTTP", {
  route: "leads/{ilead:long}/verificar",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const Controller: TLeadController = new TLeadController(request, context);
    let ResponseData: TResponseData = await Controller.ctxUser.PrepareRequest();
    try {
      const verificacion: TMensajesVerificacion = await Controller.verificar(
        TLead.JSONToObject<TLead>(Controller.params),
      );
      ResponseData = RstExitosa({
        body: { verificacion: verificacion.toJSON() },
      });
    } catch (error) {
      ResponseData = RstError(error);
    }
    return Controller.sendResponse(ResponseData, false);
  },
});

app.get("GET_LEAD", {
  route: "lead/test",
  authLevel: "anonymous",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const Controller: TLeadController = new TLeadController(request, context);
    let ResponseData: TResponseData = await Controller.ctxUser.PrepareRequest();
    try {
      const lead: TLead = TLead.JSONToObject({
        ilead: 321,
        nombre: "mateo",
        correos: [{ email: "mateo@contapyme.com", bprincipal: true }],
      });

      await Controller.insert(lead);

      //Se prepara la respuesta
      ResponseData = RstExitosa({
        body: {
          datos: lead.toJSON(),
        },
      });
    } catch (error) {
      ResponseData = RstError(error);
    }
    return Controller.sendResponse(ResponseData, false);
  },
});
