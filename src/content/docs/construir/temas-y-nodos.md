---
title: Temas y nodos
description: La estructura fundamental de un agente — cómo funcionan los temas, los nodos y el flujo de conversación.
sidebar:
  order: 1
---

## Qué es un tema

Un tema es una unidad de conversación — un flujo que se activa cuando el usuario dice algo que coincide con sus frases disparadoras o cuando otro tema lo invoca explícitamente.

Piensa en los temas como las "funciones" de tu agente. Cada uno resuelve algo concreto.

## Tipos de nodos

<!-- TODO: Detallar cada tipo de nodo con ejemplos -->

Los nodos son los bloques que componen un tema:

- **Disparador** — Define cuándo se activa el tema (frases, eventos, invocación).
- **Mensaje** — Envía texto, imágenes o tarjetas adaptativas al usuario.
- **Pregunta** — Solicita información y la guarda en una variable.
- **Condición** — Bifurca el flujo según el valor de una variable.
- **Acción** — Ejecuta un flujo de Power Automate o un conector.
- **Redirección** — Salta a otro tema.
- **Respuesta generativa** — Usa IA para generar una respuesta basada en fuentes de conocimiento.

## Buenas prácticas

:::tip
Mantén los temas cortos y enfocados. Un tema que intenta resolver demasiadas cosas se vuelve imposible de mantener. Si un tema tiene más de 15-20 nodos, probablemente necesita dividirse.
:::
