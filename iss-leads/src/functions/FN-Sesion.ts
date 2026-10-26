import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { TJSONObject, TResponseData } from "@ingenieria_insoft/ispgen";
import { RstError, RstExitosa } from "@ingenieria_insoft/ispserver";
import { TUsuarioController } from "../sources/020 Controllers/040_UlUsuarioServer";

app.post("SESION_INSERT_HTTP", {
  route: "sesiones",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const Controller: TUsuarioController = new TUsuarioController(
      request,
      context,
    );
    let ResponseData: TResponseData = await Controller.ctxUser.PrepareRequest();
    try {
      const datos: TJSONObject = await Controller.iniciarSesion(
        Controller.ctxUser.jsonBody,
      );
      ResponseData = RstExitosa({ body: { datos } });
    } catch (error) {
      ResponseData = RstError(error);
    }
    return Controller.sendResponse(ResponseData, false);
  },
});

app.deleteRequest("SESION_DELETE_HTTP", {
  route: "sesiones/actual",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const Controller: TUsuarioController = new TUsuarioController(
      request,
      context,
    );
    let ResponseData: TResponseData = await Controller.ctxUser.PrepareRequest();
    try {
      await Controller.cerrarSesion();
      ResponseData = RstExitosa({ body: { datos: { cerrada: true } } });
    } catch (error) {
      ResponseData = RstError(error);
    }
    return Controller.sendResponse(ResponseData, false);
  },
});
