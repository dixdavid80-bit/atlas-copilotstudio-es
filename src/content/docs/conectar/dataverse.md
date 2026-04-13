---
title: Dataverse
description: Cómo conectar tu agente con datos estructurados en Dataverse.
sidebar:
  order: 2
---

## Qué es Dataverse en este contexto

Dataverse es la capa de datos de Power Platform. Tu agente puede leer y escribir datos en tablas de Dataverse, ya sea directamente o a través de Power Automate.

## Conexión directa vs. vía Power Automate

| Método | Cuándo usarlo |
|--------|---------------|
| **Directo (fuente de conocimiento)** | Consultas de lectura simples sobre datos estructurados |
| **Power Automate** | Operaciones CRUD, lógica de negocio, transformaciones |

<!-- TODO: Ejemplos de ambos enfoques -->

:::tip
Para la mayoría de casos empresariales, la ruta Power Automate es más robusta. La conexión directa es útil para prototipos rápidos, pero tiene limitaciones de filtrado y paginación.
:::
