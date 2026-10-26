---
Titulo: Deudas técnicas
Estado: borrador
Autor:
tags: [leads, deuda-tecnica]
aliases: [Deuda técnica]
---

# Deudas técnicas

## No hay deudas técnicas abiertas

| # | Deuda | Por qué está pendiente | Impacto si no se resuelve | Costo estimado | Prioridad | Seguimiento |
| --- | --- | --- | --- | --- | --- | --- |

Las dos deudas de la primera fase se saldaron juntas y en el orden previsto, porque la identidad era la raíz de ambas. DT2 (el API aceptaba cualquier petición) se saldó con el inicio de sesión y la validación del JWT en `TSistemaLeads`, y DT1 (sin registro de quién creó o cambió un dato) con las columnas de auditoría del Modelo B que esa misma clase llena desde la sesión. Su detalle quedó en el historial de Git; lo vigente está en [Seguridad](040-Procesos/010-Seguridad.md) y en [Modelo de datos](030-Modelado-de-datos/010-Modelo-de-datos.md).
