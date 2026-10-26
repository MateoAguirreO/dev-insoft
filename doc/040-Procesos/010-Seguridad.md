---
Titulo: Seguridad
Estado: borrador
Autor:
tags: [leads, procesos]
aliases: [JWT]
---

# Seguridad

## En esta fase el servicio no autentica ni autoriza

Cualquier petición que llegue a `ISS-Leads` se atiende, traiga o no token. No hay login, permisos ni filtros de seguridad de datos: es la deuda técnica DT2 de [Deudas técnicas](../990-Deudas-tecnicas.md).

## El JWT se define ahora para no cambiar el contrato después

Los consumidores envían el token desde el primer día, de modo que activar la validación más adelante no obliga a cambiar `ISW-Leads` ni la colección de Postman.

**Transporte:** header `Authorization: Bearer <token>`.

**Encabezado del token:**

```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload:** reutiliza la interfaz `IInfoAuthorization` de `ISPGen` (no se crea un tipo nuevo) más los claims estándar de tiempo.

| Claim | Tipo | Obligatorio | Contenido |
| --- | --- | --- | --- |
| `usuario` | `string` (máx. 30) | Sí | Identificador del usuario que hace la petición |
| `iapp` | `keyof typeof TIS_IApp` | Sí | Aplicación que llama, según el enum de `ISPGen` |
| `iequipo` | `number` | No | Identificador del equipo desde el que se llama |
| `iat` | `number` (segundos Unix) | Sí | Momento de emisión |
| `exp` | `number` (segundos Unix) | Sí | Momento de vencimiento |

Ejemplo con datos sintéticos:

```json
{ "usuario": "dev01", "iapp": "IAppOther", "iequipo": 1, "iat": 1793000000, "exp": 1793003600 }
```

**En esta fase el servicio no lee el token:** no verifica la firma, no revisa `exp` y no usa los claims. Cuando se implemente la validación, una petición sin token, con firma inválida o vencida responderá `Rst401`.

## Inventario de datos sensibles

| Dato | Dónde está | Cómo se protege | Quién lo ve |
| --- | --- | --- | --- |
| Nombre, empresa, cargo, teléfono y ciudad del lead | `leads` | BD local; en el repositorio y en Postman solo datos sintéticos | Cualquiera con acceso al servicio local |
| Correos del lead | `leads_correos`, `leads_mensajes.email` | Igual que el anterior | Cualquiera con acceso al servicio local |
| Contenido de los mensajes | `leads_mensajes.asunto`, `leads_mensajes.cuerpo` | Igual que el anterior | Cualquiera con acceso al servicio local |

## Inventario de secretos

| Secreto | Dónde se guarda | Quién lo rota |
| --- | --- | --- |
| Usuario y clave de PostgreSQL local | `local.settings.json` de `ISS-Leads`, fuera del control de versiones | Desarrollador |
| Token de npm para `@ingenieria_insoft/*` | `~/.npmrc` del usuario, nunca en el repositorio | Líder técnico |
| Llave de firma del JWT | No existe en esta fase. Cuando exista: Application Settings de la Function App y `local.settings.json` en local | *Pendiente · Líder técnico* |

## Riesgos aceptados

| Riesgo | Por qué se acepta | Aprueba |
| --- | --- | --- |
| El API no tiene control de acceso (deuda técnica DT2 en [Deudas técnicas](../990-Deudas-tecnicas.md)) | Solo corre en el equipo local y con datos sintéticos | *Pendiente · Líder técnico* |
| Los cambios sobre datos personales no dejan registro de autoría (deuda técnica DT1 en [Deudas técnicas](../990-Deudas-tecnicas.md)) | Solo corre en el equipo local y con datos sintéticos | *Pendiente · Líder técnico* |
