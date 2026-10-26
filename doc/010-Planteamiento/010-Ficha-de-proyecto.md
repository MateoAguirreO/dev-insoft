---
Titulo: Ficha de proyecto
Estado: borrador
Autor:
tags: [leads, planteamiento]
aliases: [Alcance]
---

# Ficha de proyecto

> **Datos personales:** el módulo guarda nombre, teléfono y correos de personas (leads), por lo que aplica la Ley 1581 de 2012. El atributo A2 fija la meta de protección.

## Para qué

| Parte | Contenido |
| --- | --- |
| Situación actual | *Pendiente · Líder del proyecto* |
| Problema | *Pendiente · Líder del proyecto* |
| Consecuencia de no hacerlo | *Pendiente · Líder del proyecto* |
| Por qué ahora | *Pendiente · Líder del proyecto* |

## Objetivos y atributos de calidad

| # | Objetivo o atributo | Cómo se mide | Meta |
| --- | --- | --- | --- |
| O1 | Administrar leads con sus correos: obtener, crear, modificar, eliminar, listar, verificar, duplicar y recodificar | Ejecución de la colección de Postman contra la BD local | 100 % de las operaciones del alcance responden según su contrato |
| O2 | Registrar y consultar los mensajes enviados a cada lead | Ejecución de la colección de Postman contra la BD local | 100 % de las operaciones del alcance responden según su contrato |
| O3 | Controlar el acceso con usuario, clave y token, y registrar quién crea o modifica cada lead, mensaje y usuario | Ejecución de la colección de Postman contra la BD local | Sin token válido toda operación responde 401; con token, cada cambio deja su auditoría |
| A1 | Integridad sin llaves foráneas: ningún correo ni mensaje queda huérfano | Consulta de filas de `leads_correos` y `leads_mensajes` cuyo `ilead` no existe en `leads`, después de eliminar, duplicar y recodificar | 0 filas |
| A2 | Protección de datos personales | Apariciones de datos reales de personas en el repositorio, los ejemplos, la colección de Postman o los logs | 0 apariciones |
| A3 | Ninguna clave en texto plano | Claves en texto plano en la BD, el repositorio o la colección, y respuestas de usuarios que traen la columna `clave` | 0 apariciones |

## El alcance cubre tres entidades, la autenticación y la auditoría

1. **Lead (`leads`)** con todas las operaciones que trae el controlador de catálogo del paquete base: obtener, insertar, modificar, eliminar, listar (paginado y con filtros), verificar, duplicar y recodificar.
2. **Correos del lead (`leads_correos`)**, detalle que viaja dentro del lead: se guarda, duplica, recodifica y elimina con él.
3. **Mensajes enviados (`leads_mensajes`)**, movimiento del lead: se registran, se listan por lead y se consultan uno a uno. No se modifican.
4. **Autenticación con JWT**: usuarios (`seg_usuarios`), inicio y cierre de sesión (`seg_sesiones`) y validación del token en cada operación. Ver [Seguridad](../040-Procesos/010-Seguridad.md).
5. **Auditoría del Modelo B** en `leads`, `leads_mensajes` y `seg_usuarios`, llenada desde la sesión del token. Ver [Modelo de datos](../030-Modelado-de-datos/010-Modelo-de-datos.md).
6. **Base de datos PostgreSQL local**, con el modelo de [Modelo de datos](../030-Modelado-de-datos/010-Modelo-de-datos.md) y los componentes de [Componentes](../020-Arquitectura/020-Componentes.md).

## No incluye

| Qué | Motivo | Queda |
| --- | --- | --- |
| Permisos por usuario y seguridad de datos (`segDatosWhere`) | Exigen definir roles, y el alcance de esta fase no los pide: todo usuario con sesión accede a todo (ver los riesgos aceptados en [Seguridad](../040-Procesos/010-Seguridad.md)) | Aplazado |
| Inicio de sesión en `ISW-Leads` | Se priorizó el servicio; mientras la web no envíe token, sus llamadas al API responden 401 | Aplazado |
| Consolidar leads | `ISPAzureUtils` 2.0.14 arma el SQL de consolidar solo para MS-SQL (`@@ROWCOUNT`, `UPDATE … FROM … INNER JOIN`) y no tiene variante PostgreSQL; además fusiona los detalles solo por `ilead`, así que perdería los correos del lead origen que el destino no tiene | Aplazado hasta corregir el paquete base |
| Modificar o anular mensajes | Un movimiento se registra una vez; corregirlo es registrar otro | Fuera |
| Envío real de correos (SMTP o proveedor) | El alcance pide el registro del mensaje enviado, no el canal de envío (ver D4) | Fuera, a confirmar |
| Caché en Azure Tables y log de peticiones en Blob Storage | Vienen desactivados en el paquete base y en local no hay Azure Storage | Fuera |
| Despliegue a Azure (staging y producción) | El ambiente de esta fase es local | Aplazado |

## Supuestos y restricciones

| # | Tipo | Enunciado |
| --- | --- | --- |
| R1 | Restricción | El motor es PostgreSQL 18, instalado en el equipo local |
| R2 | Restricción | La BD no declara llaves foráneas (norma InSoft): la integridad la valida el controlador |
| R3 | Restricción | Los paquetes `@ingenieria_insoft/*` son privados: instalarlos exige el token de npm en el `~/.npmrc` del usuario |
| S1 | Supuesto | «Mensaje enviado» es el registro de un mensaje que salió por otro medio; el servicio no lo envía |
| S2 | Supuesto | Los campos de negocio del lead son una propuesta a validar (ver [Modelo de datos](../030-Modelado-de-datos/010-Modelo-de-datos.md)) |

## Participantes

| Rol | Responsabilidad |
| --- | --- |
| Líder del proyecto | Define el alcance y aprueba esta ficha |
| Líder técnico | Aprueba arquitectura, modelo de datos, decisiones y desviaciones de la norma |
| Desarrollador | Construye el servicio y la colección de Postman; mantiene esta documentación |

## Matriz de decisiones

| # | Decisión | Alternativas | Propuesta | Decide | Estado |
| --- | --- | --- | --- | --- | --- |
| D1 | Configuración del proyecto | A: transversal + servidor + servicio · C: solo servicio | **C**: módulo pequeño; objetos y controladores viven en `ISS-Leads` | Líder técnico | Propuesta |
| D2 | Qué tablas acompañan al lead en duplicar, recodificar y eliminar | Todas · Solo correos | Duplicar copia lead y correos, no mensajes (son historia del original). Recodificar mueve las tres tablas. Eliminar se rechaza si el lead tiene mensajes | Líder técnico | Propuesta |
| D3 | Llave de `leads` y `leads_mensajes` | `bigint` secuencial · código `varchar` | `bigint` que asigna el controlador con `nextVal` de `ISPBDSQL` sobre las secuencias `seq_leads` y `seq_leads_mensajes` | Líder técnico | Propuesta |
| D4 | ¿El servicio envía los correos? | Solo registro · integración de envío | Solo registro | Líder del proyecto | Propuesta |
| D5 | Nombre de las piezas | `iss-inventario` / `isw-inventario` · `iss-leads` / `isw-leads` | **`iss-leads` / `isw-leads`**: el servicio se nombra por su entidad; las carpetas ya se renombraron | Líder técnico | Aprobada |
| D6 | ¿El cliente web `ISW-Leads` entra en esta fase? | Sí · No | **Sí**: se pidió empezar a codificar el cliente `ISW-Leads` | Líder del proyecto | Aprobada |
| D7 | Cómo se guarda la clave | SHA-256 · scrypt con sal propia | **scrypt** de `node:crypto`: es lento y con sal, así una tabla filtrada no se descifra por fuerza bruta; no agrega dependencias | Líder técnico | Propuesta |
| D8 | Cómo se valida el token | Solo la firma · la firma y una sesión guardada | **Firma y sesión en `seg_sesiones`**, con `jsonwebtoken` como piden las skills 02 y 04: permite cerrar sesión y cortar los tokens de un usuario antes de que venzan | Líder técnico | Propuesta |

## Referencias

| Recurso | Ubicación |
| --- | --- |
| SharePoint del proyecto | *Pendiente · Líder del proyecto* |
| Colección de Postman | *Pendiente · Desarrollador* |
| Staging | No aplica en esta fase |
| Producción | No aplica en esta fase |
