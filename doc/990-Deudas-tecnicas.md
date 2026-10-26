---
Titulo: Deudas técnicas
Estado: borrador
Autor:
tags: [leads, deuda-tecnica]
aliases: [Deuda técnica]
---

# Deudas técnicas

## Dos deudas se tomaron a sabiendas para cerrar esta fase en local

| # | Deuda | Por qué está pendiente | Impacto si no se resuelve | Costo estimado | Prioridad | Seguimiento |
| --- | --- | --- | --- | --- | --- | --- |
| DT1 | **No queda registro de quién, desde qué aplicación, equipo o IP ni cuándo se creó o modificó un lead o un mensaje.** Ninguna de las tres tablas lleva columnas de auditoría y los objetos extienden `TObject` (ver [Modelo de datos](030-Modelado-de-datos/010-Modelo-de-datos.md)). | Decisión del proyecto para esta fase: no se trabaja con datos de auditoría. Se prefirió un modelo de tres tablas sin columnas adicionales y controladores que extienden `TControllerServer` directamente, sin clase intermedia. Además, la auditoría se llenaría con los claims del JWT, que en esta fase no se leen. | Se rompe la trazabilidad de los datos personales de los leads. El síntoma no se ve: el servicio responde igual con o sin auditoría. Lo nota el líder técnico, o quien atienda una reclamación sobre datos personales (Ley 1581 de 2012), cuando pregunta quién creó o cambió un lead y no hay respuesta. Para lo que se escriba antes de resolver la deuda, el rastro no se puede reconstruir. | **Medio:** agregar las columnas de auditoría del Modelo B (10 en `leads` y 5 en `leads_mensajes`; `leads_correos` es detalle y no lleva); cambiar `TLead` a `TObjectBase` y `TLeadMensaje` a `TObjectBaseMov`; crear un controlador abstracto intermedio que estampe la auditoría en insert y update y llene `camposAuditoriaInsert` y `camposAuditoriaUpdate` (los usan duplicar y recodificar) a partir de los claims del JWT; migrar las tablas. | Alta | *Pendiente · Líder técnico* |
| DT2 | **El API acepta cualquier petición: no valida el JWT, no autentica y no autoriza.** El token solo se define y el servicio no lo lee; tampoco hay permisos por usuario ni filtros de seguridad de datos (ver [Seguridad](040-Procesos/010-Seguridad.md)). | Decisión del proyecto para esta fase: el alcance pide solo la definición del token. Se prefirió fijar primero el contrato (header Bearer y payload `IInfoAuthorization`) para que los consumidores lo envíen desde el primer día y activar la validación después no los obligue a cambiar. Los permisos van detrás de la autenticación porque, sin identidad confiable, no hay sobre qué filtrar. | Se rompe la confidencialidad de los datos personales: quien alcance el servicio lee, crea, modifica y borra leads, correos y mensajes (Ley 1581 de 2012). El síntoma no se ve: el servicio responde con normalidad a una petición legítima y a una sin token. Nadie lo nota en la operación; aparece en un incidente o en una revisión de seguridad. Debe resolverse antes de cualquier despliegue fuera del equipo local. | **Alto:** validar la firma y `exp` del JWT con la llave guardada en Application Settings (`local.settings.json` en local); responder `Rst401` si falta, es inválido o venció; definir quién emite el token, que hoy no está definido; y, después, implementar los permisos con `segDatosWhere`. | Alta | *Pendiente · Líder técnico* |

## La identidad es la raíz de las dos, así que se atienden en orden y juntas

**Ninguna de las dos se ve como falla mientras todo funciona**: el servicio responde igual sin autenticación y sin auditoría, y el daño aparece cuando alguien pregunta quién tocó un dato personal o cuando el servicio sale del equipo local. Por eso ninguna queda en prioridad baja, aunque hoy solo se use con datos sintéticos.

DT2 va primero porque DT1 se alimenta de ella: el usuario, la aplicación y el equipo salen de los claims del JWT, que solo son confiables cuando el servicio valida el token; la IP no es un claim y sale de la petición. Por eso tiene sentido atenderlas juntas: el controlador abstracto intermedio que valida el token es el mismo que estampa la auditoría.
