---
title: Entidades y variables
description: Cómo capturar, almacenar y utilizar datos dentro de las conversaciones.
sidebar:
  order: 2
---

## Entidades

Las entidades son los tipos de datos que tu agente puede reconocer y extraer de lo que dice el usuario.

### Entidades predefinidas

Copilot Studio incluye entidades listas para usar:

- **Edad**, **Fecha**, **Hora**, **Número** — reconocimiento numérico y temporal.
- **Ciudad**, **País** — entidades geográficas.
- **Email**, **URL**, **Teléfono** — patrones comunes.
- **Persona** — nombres propios.

### Entidades personalizadas

Cuando las predefinidas no cubren tu caso:

- **Lista cerrada** — Un conjunto fijo de opciones (ej: departamentos, tipos de incidencia).
- **Regex** — Patrones personalizados (ej: números de pedido con formato específico).

<!-- TODO: Ejemplos prácticos de entidades custom -->

## Variables

Las variables almacenan datos durante la conversación.

| Ámbito | Duración | Uso típico |
|--------|----------|------------|
| **Tema** | Solo durante el tema activo | Datos temporales de un flujo |
| **Global** | Toda la sesión | Nombre del usuario, idioma, contexto |
| **Sistema** | Toda la sesión (solo lectura) | Canal, ID de conversación |

:::tip
Usa variables globales para datos que necesitas en múltiples temas (nombre del usuario, rol, idioma). No abuses — demasiadas variables globales dificultan el debug.
:::
