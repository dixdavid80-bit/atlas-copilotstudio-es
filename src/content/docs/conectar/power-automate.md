---
title: Power Automate
description: Cómo integrar flujos de Power Automate para que tu agente ejecute acciones reales.
sidebar:
  order: 1
---

## Por qué Power Automate

Sin Power Automate, tu agente solo puede conversar. Con Power Automate, puede **hacer cosas**: crear tickets, enviar correos, consultar bases de datos, actualizar registros en CRM.

Es la integración más importante de Copilot Studio.

## Cómo funciona la integración

1. Creas un flujo en Power Automate con un disparador especial: **"Cuando Copilot Studio llama a un flujo"**.
2. Defines los parámetros de entrada (lo que el agente envía al flujo).
3. Defines los parámetros de salida (lo que el flujo devuelve al agente).
4. Desde Copilot Studio, usas un nodo de **Acción** para invocar el flujo.

<!-- TODO: Ejemplo práctico paso a paso -->

## Buenas prácticas

:::tip
Diseña los flujos como APIs: entrada clara, salida clara, sin side effects inesperados. Un flujo bien diseñado se puede reutilizar en múltiples temas.
:::

- Maneja errores en el flujo — si falla, devuelve un mensaje de error legible, no un JSON crudo.
- Usa variables de entorno para URLs y credenciales — nunca hardcodes.
- Testea el flujo de forma independiente antes de conectarlo al agente.
