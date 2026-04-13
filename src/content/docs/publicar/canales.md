---
title: Canales de publicación
description: Dónde y cómo publicar tu agente — Teams, web, WhatsApp y más.
sidebar:
  order: 1
---

## Canales disponibles

| Canal | Dificultad | Notas |
|-------|-----------|-------|
| **Microsoft Teams** | Baja | Integración nativa, el canal más directo |
| **Sitio web** | Baja | Widget embebido con iframe |
| **Facebook Messenger** | Media | Requiere configuración en Meta |
| **WhatsApp** | Media-Alta | Requiere cuenta de WhatsApp Business API |
| **Otros (Telegram, Slack, etc.)** | Alta | Vía Azure Bot Service |

## Teams — el canal natural

<!-- TODO: Paso a paso de publicación en Teams -->

:::tip
Si tu audiencia ya está en Teams, empieza por ahí. La integración es nativa, no requiere configuración adicional de infraestructura, y los usuarios no necesitan instalar nada nuevo.
:::

## Web — widget embebido

El widget web es un iframe que puedes incrustar en cualquier página. Útil para:

- Portales de soporte interno.
- Páginas de FAQ.
- Landing pages de productos.

<!-- TODO: Código de ejemplo del embed -->

## Autenticación

Cuando tu agente necesita saber quién es el usuario:

- **Teams** — La identidad viene automáticamente de Entra ID.
- **Web** — Necesitas configurar autenticación manual (OAuth 2.0 con Entra ID).

:::caution
Un agente publicado en web sin autenticación es accesible por cualquiera que tenga la URL. Evalúa si necesitas restringir el acceso antes de publicar.
:::
