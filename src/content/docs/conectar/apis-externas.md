---
title: APIs externas
description: Cómo conectar tu agente con servicios y APIs fuera del ecosistema Microsoft.
sidebar:
  order: 3
---

## El panorama

Copilot Studio no llama APIs directamente — necesitas un intermediario. Las opciones:

1. **Power Automate + conector HTTP** — La más común. Usas un flujo con la acción HTTP para llamar a cualquier API REST.
2. **Conectores custom** — Defines un conector reutilizable en Power Platform que encapsula una API.
3. **Azure Functions** — Para lógica compleja que no cabe en Power Automate.

## Conectores custom

<!-- TODO: Paso a paso para crear un conector custom desde OpenAPI -->

:::tip
Si vas a llamar a la misma API desde varios flujos o agentes, invierte tiempo en crear un conector custom. El esfuerzo inicial se amortiza rápido.
:::

## Autenticación

Los patrones más comunes:

- **API Key** — Simple, funciona para la mayoría de servicios.
- **OAuth 2.0** — Necesario para APIs que requieren autenticación delegada.
- **Managed Identity** — Para servicios dentro de Azure, la opción más segura.

:::caution
Nunca almacenes credenciales en variables del agente. Usa siempre variables de entorno o Azure Key Vault a través de Power Automate.
:::
