---
title: ALM — Ciclo de vida
description: Gestión del ciclo de vida de agentes — entornos, soluciones y despliegues.
sidebar:
  order: 1
---

## Qué es ALM en este contexto

Application Lifecycle Management (ALM) es cómo gestionas el ciclo de vida de tus agentes: desarrollo, pruebas, producción. En Power Platform, esto se hace con **entornos** y **soluciones**.

## Entornos

La recomendación mínima para producción:

| Entorno | Propósito |
|---------|-----------|
| **Desarrollo** | Donde construyes y experimentas |
| **Pruebas / UAT** | Donde validas antes de producción |
| **Producción** | El agente que usan los usuarios reales |

## Soluciones

Las soluciones son el mecanismo de empaquetado de Power Platform. Tu agente, sus temas, sus flujos — todo viaja dentro de una solución.

<!-- TODO: Flujo de exportación/importación entre entornos -->

:::tip
Trabaja siempre dentro de una solución desde el día uno. Migrar un agente que se creó fuera de una solución es doloroso y propenso a errores.
:::

## Pipelines

<!-- TODO: Detallar Power Platform Pipelines y alternativas con Azure DevOps -->

:::caution
Los Pipelines de Power Platform están en evolución constante. La funcionalidad disponible cambia cada trimestre — verifica el estado actual antes de planificar tu estrategia de ALM.
:::
