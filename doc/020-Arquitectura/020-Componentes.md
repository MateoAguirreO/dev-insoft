---
Titulo: Componentes
Estado: borrador
Autor:
tags: [leads, arquitectura]
aliases:
---

# Componentes

![Diagrama de componentes de Leads](../999-Adjuntos/010-Diagramas/020-Componentes-Leads.svg)

## Todo el código propio vive en el servicio

El proyecto usa la configuración C (decisión D1 de la [Ficha de proyecto](../010-Planteamiento/010-Ficha-de-proyecto.md)): no se crea ni publica ningún paquete npm propio. Objetos y controladores viven dentro de `ISS-Leads`, separados de los handlers, y heredan de los paquetes base de InSoft.

| Componente                             | Responsabilidad                                                                                                             | Se comunica con             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `ISW-Leads`                            | Cliente web en Astro + Svelte. Entra en esta fase según la decisión D6                                                      | `ISS-Leads` por HTTP        |
| Postman                                | Colección que prueba y documenta cada operación del API                                                                     | `ISS-Leads` por HTTP        |
| `src/functions/`                       | Registra las rutas HTTP, instancia el controlador y delega. No tiene lógica de negocio                                      | Controladores               |
| `TLeadController`                      | CRUD, verificar, listar, duplicar y recodificar el lead; guarda los correos como detalle y los entrega dentro del lead      | `ISPAzureUtils`, PostgreSQL |
| `TLeadMensajeController`               | Registra, lista y consulta los mensajes de un lead; valida que el destinatario sea un correo del lead                       | `ISPAzureUtils`, PostgreSQL |
| `TLead`, `TLeadCorreo`, `TLeadMensaje` | Objetos de dominio; extienden `TObject`                                                                                     | —                           |
| Paquetes base InSoft                   | Controlador CRUD (`TControllerServer`), registro de rutas de catálogo, conexión a BD, respuestas REST y conversores de tipo | PostgreSQL (vía `ISPBDSQL`) |
| PostgreSQL 18                          | Guarda `leads`, `leads_correos` y `leads_mensajes`                                                                          | —                           |
|                                        |                                                                                                                             |                             |

`TLeadController` y `TLeadMensajeController` extienden directamente `TControllerServer`: sin auditoría ni autenticación (ver [Deudas técnicas](../990-Deudas-tecnicas.md)) no hay lógica común que justifique una clase abstracta intermedia.

## Integraciones

| Sistema | Dirección y protocolo | Contrato y versión | Autenticación | Ante falla | Restricciones |
| --- | --- | --- | --- | --- | --- |
| PostgreSQL 18 local | `ISS-Leads` → BD, driver `pg` vía `ISPBDSQL` (`DB_ENGINE=PG`) | [Modelo de datos](../030-Modelado-de-datos/010-Modelo-de-datos.md) | Usuario y clave de la BD en `local.settings.json`, no versionado | La operación responde 500 con `RstError`; cada escritura corre en una transacción, así que no queda nada a medias | Solo ambiente local |
| Consumidores (`ISW-Leads`, Postman) | Consumidor → `ISS-Leads`, HTTP REST con JSON | Colección de Postman (*Pendiente · Desarrollador*) | Header `Authorization: Bearer <JWT>`, que no se valida (ver [Seguridad](../040-Procesos/010-Seguridad.md)) | El consumidor recibe la respuesta estándar de `ISPServer` con el código y el mensaje del error | Sin control de acceso en esta fase (ver [Deudas técnicas](../990-Deudas-tecnicas.md)) |

## Dependencias

| Depende de | Qué pasa si no está |
| --- | --- |
| Paquetes `@ingenieria_insoft/*` (`ISPGen`, `ISPNodeJS`, `ISPServer`, `ISPBDSQL`, `ISPAzureUtils` 2.x) | `npm ci` falla con 401/403/404 y el servicio no compila |
| Token de npm en el `~/.npmrc` del usuario | No se pueden instalar los paquetes privados |
| PostgreSQL 18 corriendo, con las tablas y secuencias creadas | Todas las operaciones responden 500 |
| Azure Functions Core Tools (`func start`) | El servicio no arranca en local |
