---
title: Autenticación
description: Cómo configurar autenticación para que tu agente sepa quién es el usuario.
sidebar:
  order: 2
---

## Cuándo necesitas autenticación

- Cuando el agente accede a datos personalizados por usuario.
- Cuando necesitas restringir quién puede usar el agente.
- Cuando los flujos de Power Automate necesitan ejecutarse en el contexto del usuario.

## Opciones de autenticación

<!-- TODO: Configuración paso a paso de cada opción -->

### Solo Teams (sin configuración)

En Teams, la identidad del usuario llega automáticamente. Puedes acceder al nombre, email y otros datos del perfil sin configurar nada.

### Entra ID (antes Azure AD)

Para canales web y otros canales externos:

1. Registra una aplicación en Entra ID.
2. Configura los scopes necesarios.
3. Vincula la aplicación desde Copilot Studio → Configuración → Seguridad.

### Sin autenticación

Válido para agentes públicos que no manejan datos personales.

:::tip
Empieza sin autenticación para prototipar rápido. Añádela cuando tengas claro qué datos del usuario necesitas y en qué canal publicarás.
:::
