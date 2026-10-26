

\set ON_ERROR_STOP on

SELECT 'CREATE DATABASE leads'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'leads')\gexec

\connect leads

\ir schema/010_leads.sql
\ir schema/020_leads_correos.sql
\ir schema/030_leads_mensajes.sql
\ir schema/040_secuencias.sql
\ir schema/050_seg_usuarios.sql
\ir schema/060_seg_sesiones.sql
