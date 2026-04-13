---
title: Gobernanza
description: Políticas, DLP y control de agentes en entornos empresariales.
sidebar:
  order: 3
---

## Por qué importa

En entornos empresariales, cualquiera con licencia puede crear un agente. Sin gobernanza, acabas con docenas de agentes huérfanos, sin dueño, sin mantenimiento, accediendo a datos que no deberían.

## DLP — Data Loss Prevention

Las políticas de DLP controlan qué conectores puede usar cada agente:

- **Grupo Business** — Conectores aprobados para datos corporativos.
- **Grupo Non-Business** — Conectores para datos no sensibles.
- **Bloqueados** — Conectores que no se pueden usar en ningún caso.

<!-- TODO: Configuración práctica de políticas DLP -->

## Control de creación

- **Quién puede crear agentes** — Gestión desde el centro de administración de Power Platform.
- **En qué entornos** — Limita la creación de agentes a entornos controlados.
- **Con qué conectores** — DLP define los límites.

:::tip
No bloquees todo por defecto — eso mata la adopción. La estrategia correcta es permitir experimentación en entornos de desarrollo y controlar lo que llega a producción.
:::
