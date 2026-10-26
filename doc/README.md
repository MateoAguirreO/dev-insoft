---
Titulo: Documentación del proyecto Leads
Estado: borrador
Autor:
tags: [documentacion]
aliases:
---

# Documentación del proyecto Leads

El proyecto tiene un solo módulo, Leads, así que la estructura va directa en esta carpeta, sin carpeta General.

## Índice

| Sección | Nota |
| --- | --- |
| Planteamiento | [Ficha de proyecto](010-Planteamiento/010-Ficha-de-proyecto.md) |
| Arquitectura | [Componentes](020-Arquitectura/020-Componentes.md) |
| Modelado de datos | [Modelo de datos](030-Modelado-de-datos/010-Modelo-de-datos.md) |
| Procesos | [Seguridad](040-Procesos/010-Seguridad.md) |

## Vocabulario de tags

Toda nota lleva de dos a cuatro tags en orden módulo, sección, tema. Solo valen los de esta tabla.

| Familia | Tags |
| --- | --- |
| Módulo | `leads` · `documentacion` (solo esta nota) |
| Sección | `planteamiento` · `arquitectura` · `datos` · `procesos` · `metricas` · `decisiones` · `deuda-tecnica` · `adjuntos` |
| Tema | Ninguno declarado todavía |

## Desviaciones de la norma

| Regla | Desviación | Motivo | Aprueba |
| --- | --- | --- | --- |
| La carpeta raíz se llama `docs/` | Se llama `doc/` | Es la bóveda de Obsidian que ya existía en el proyecto | *Pendiente · Líder técnico* |
| Diagramas en Visual Paradigm exportados a SVG, con el modelo original en adjuntos | Los SVG se escribieron a mano y son su propia fuente | No hay modelo de Visual Paradigm; el SVG es texto y se edita directamente | *Pendiente · Líder técnico* |
| La documentación vive en el repositorio `ISD-{Proyecto}` | Vive en una carpeta local sin Git | El proyecto aún no tiene repositorio | *Pendiente · Líder técnico* |
