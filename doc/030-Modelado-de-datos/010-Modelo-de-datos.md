---
Titulo: Modelo de datos
Estado: borrador
Autor:
tags: [leads, datos]
aliases: [DER]
---

# Modelo de datos

![Diagrama entidad-relación de Leads](../999-Adjuntos/010-Diagramas/010-DER-Leads.svg)

## Cada tabla tiene un tipo, y el tipo decide su auditoría

El tipo dice cómo se comporta la tabla y qué columnas de auditoría lleva, según el Modelo B (usuario único) de la norma: las de datos llevan creación y modificación, las de movimiento solo creación porque no se modifican, y las de detalle ninguna porque las cubre su tabla principal.

| Tabla | Tipo | Llave primaria | Objeto | Auditoría | Se modifica |
| --- | --- | --- | --- | --- | --- |
| `leads` | Datos (entidad principal) | `ilead` | `TLead` (`TObjectBase`) | Creación y modificación | Sí |
| `leads_correos` | Detalle de `leads` | `ilead`, `email` | `TLeadCorreo` (`TObject`) | No lleva | Solo a través del lead |
| `leads_mensajes` | Movimiento de `leads` | `imensaje` | `TLeadMensaje` (`TObjectBaseMov`) | Creación | No: se registra una vez |
| `seg_usuarios` | Datos | `iusuario` | `TUsuario` (`TObjectBase`) | Creación y modificación | Sí |
| `seg_sesiones` | Movimiento | `isesion` | `TSesion` (`TObjectBaseMov`) | Creación | No: se crea al iniciar sesión y se borra al cerrarla |

Los objetos heredan las columnas de auditoría de `ISPGen`, y el controlador hidrata cada columna por su nombre: por eso cada tabla tiene exactamente las columnas que serializa su clase base.

## La auditoría la pone el servidor con los datos de la sesión

| Columnas | Tipo | Contenido |
| --- | --- | --- |
| `iusuariocre`, `iusuarioult` | `varchar(30)` | Usuario de la sesión que creó o modificó por última vez |
| `iappcre`, `iappult` | `varchar(20)` | Aplicación de la sesión (`TIS_IApp`) |
| `iequipocre`, `iequipoult` | `int` | Equipo de la sesión |
| `ipcre`, `ipult` | `varchar(20)` | IP de la petición |
| `fhcre`, `fhult` | `timestamptz` | Fecha y hora del servidor |

- Las de creación se llenan al crear y las de modificación al crear y al modificar; duplicar llena ambas en la copia y recodificar, las de modificación.
- Lo que mande el cliente en esas columnas se ignora: el origen es la sesión del token (ver [Seguridad](../040-Procesos/010-Seguridad.md)), así nadie puede firmar un cambio a nombre de otro.
- En `seg_sesiones`, la auditoría de creación es la del propio inicio de sesión, porque todavía no hay token.
- Los registros creados antes de agregar la auditoría la tienen vacía.

## Las relaciones las valida el controlador, no la base de datos

La BD no declara llaves foráneas (norma InSoft), así que estas reglas viven en el controlador y fallan con un `Rst400` si no se cumplen:

1. `leads_correos.ilead` y `leads_mensajes.ilead` deben existir en `leads`.
2. Al registrar un mensaje, `leads_mensajes.email` debe existir en `leads_correos` para ese mismo lead. Queda como copia histórica: si después se borra o cambia el correo, el mensaje conserva la dirección a la que salió.
3. Un lead tiene como máximo un correo con `bprincipal = true`.
4. `ilead`, `imensaje` e `isesion` los asigna el controlador con `nextVal` de `ISPBDSQL` sobre las secuencias `seq_leads`, `seq_leads_mensajes` y `seq_seg_sesiones`. Las columnas no usan `IDENTITY` ni `serial` (decisión D3).
5. `iusuario` es la llave natural del usuario y se guarda en minúscula y sin espacios, para que el inicio de sesión no distinga mayúsculas.
6. `seg_sesiones.iusuario` es un usuario de `seg_usuarios`; eliminar el usuario borra sus sesiones, así ningún token queda vivo sin dueño.
7. Toda columna admite nulos salvo la llave primaria; los obligatorios de negocio se validan en el controlador: `leads.nombre`, `leads_correos.email`, en el mensaje `email`, `asunto` y `fhenvio`, y en el usuario `nombre` y `clave`.

## El lead arrastra distintas tablas según la operación

Las operaciones del controlador base recorren dos listas de tablas: `tblsDuplicate` (duplicar y eliminar) y `tblsRecode` (recodificar). Esta es la propuesta de la decisión D2:

| Operación | `leads` | `leads_correos` | `leads_mensajes` |
| --- | --- | --- | --- |
| Duplicar | Copia con el `ilead` nuevo | Copia | No se copian: son historia del lead original |
| Recodificar | Cambia `ilead` | Cambia `ilead` | Cambia `ilead` |
| Eliminar | Borra | Borra | Si el lead tiene mensajes, la eliminación se rechaza |
| Modificar | Actualiza | Se reemplazan por los que llegan en el lead | No se tocan |

## El estado del lead es una lista cerrada

`iestado` guarda un valor del enum `TEstadoLead`. La lista es una propuesta (supuesto S2):

| Valor | Estado | Significa |
| --- | --- | --- |
| 1 | Nuevo | Registrado, sin contacto todavía |
| 2 | Contactado | Ya recibió al menos un mensaje o llamada |
| 3 | Calificado | Tiene interés real y cumple el perfil |
| 4 | Descartado | No continúa en el proceso |
| 5 | Convertido | Pasó a ser cliente |

`origen` es texto libre (por ejemplo: sitio web, referido, evento) hasta que el negocio defina una lista.
