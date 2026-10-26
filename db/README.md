# Base de datos de Leads

Scripts DDL de PostgreSQL 18 para la base de datos `leads` (esquema `public`). Las tablas de datos y de movimiento llevan la auditoría del Modelo B (usuario único) de la skill `diseno-bd`; las de detalle no llevan.

| Archivo | Contenido |
| --- | --- |
| `000_crear_bd.sql` | Script maestro para `psql`: crea la BD si no existe y ejecuta los demás en orden |
| `schema/010_leads.sql` | Tabla `leads` (datos) |
| `schema/020_leads_correos.sql` | Tabla `leads_correos` (detalle de `leads`) |
| `schema/030_leads_mensajes.sql` | Tabla `leads_mensajes` (movimiento de `leads`) |
| `schema/040_secuencias.sql` | Secuencias `seq_leads`, `seq_leads_mensajes` y `seq_seg_sesiones` |
| `schema/050_seg_usuarios.sql` | Tabla `seg_usuarios` (datos): usuarios del API con la clave en hash scrypt |
| `schema/060_seg_sesiones.sql` | Tabla `seg_sesiones` (movimiento): una fila por inicio de sesión, identificada en el JWT |

Sin llaves foráneas, sin `serial` ni `IDENTITY`: el controlador valida las relaciones y asigna las llaves con `NEXTVAL` de las secuencias.

## Cómo ejecutarlo

Desde la raíz del proyecto (PowerShell o Git Bash):

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -f db/000_crear_bd.sql
```

`psql` pedirá la clave del usuario `postgres`. Para no digitarla, configure `%APPDATA%\postgresql\pgpass.conf` y agregue `-w` al comando.

Los scripts son idempotentes: se pueden volver a ejecutar sin error (usan `IF NOT EXISTS`).
