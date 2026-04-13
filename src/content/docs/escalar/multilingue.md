---
title: Multilingüe
description: Cómo diseñar agentes que funcionan en varios idiomas — opciones, limitaciones y cuándo separar agentes por idioma.
sidebar:
  order: 5
---

El soporte multilingüe en Copilot Studio tiene más matices de los que parece. No se trata solo de traducir mensajes — hay diferencias de comportamiento entre el idioma principal y los idiomas secundarios, y no todos los idiomas tienen el mismo nivel de soporte en IA generativa. Conocer las limitaciones antes de diseñar el agente ahorra problemas en producción.

## Las dos estrategias

### 1. Idiomas secundarios (recomendado para la mayoría de los casos)

Defines un idioma principal para el agente y añades idiomas secundarios con traducciones para los mensajes de cada topic.

**Cómo funciona:**
- El agente detecta el idioma del usuario automáticamente según el canal (Teams, web)
- Las respuestas **generativas** (basadas en knowledge sources y el modelo de IA) se adaptan al idioma del usuario de forma automática — sin traducción manual
- Los mensajes **manuales** (los que escribes tú en los topics como "Send a message") necesitan traducción explícita para cada idioma secundario
- Los títulos de Adaptive Cards y las opciones de respuesta rápida también requieren traducción manual

**El flujo de trabajo:**
1. Crea el agente en el idioma principal
2. Navega a **Settings → Languages → Add language**
3. Selecciona el idioma secundario
4. Copilot Studio te muestra todos los strings del agente que requieren traducción manual
5. Traduce o usa la opción de traducción automática (disponible en el portal) como punto de partida

:::tip
Las respuestas generativas basadas en knowledge sources son el punto fuerte del multilingüe automático. Si tu agente depende principalmente de knowledge sources para responder (en lugar de topics con mensajes manuales fijos), el soporte multilingüe funciona de forma casi transparente para los idiomas con buen soporte en el modelo.
:::

### 2. Un agente por idioma

Un agente separado para cada idioma, con su propio system prompt, topics y configuración.

**Cuándo tiene sentido:**
- La lógica de negocio es radicalmente diferente entre mercados (no solo el idioma, sino los procesos, referencias normativas, o flujos completos)
- El volumen en cada idioma justifica un mantenimiento separado
- Los equipos responsables de cada idioma son distintos y no tienen coordinación

**El coste real:** duplicar el mantenimiento. Cada cambio en el comportamiento del agente hay que replicarlo en todos los agentes idioma. A medida que crece el número de idiomas, la carga crece linealmente.

:::caution
No separes agentes por idioma si el único motivo es la traducción. El sistema de idiomas secundarios cubre ese caso con mucho menos mantenimiento. Separa solo cuando la lógica de negocio es genuinamente distinta.
:::

## Idiomas y nivel de soporte en IA generativa

No todos los idiomas soportan el mismo nivel de capacidades. Las diferencias principales:

**Idiomas con soporte completo en IA generativa:**
- Inglés, español, francés, alemán, italiano, portugués, japonés, chino (simplificado), coreano — entre otros

**Capacidades que pueden variar según idioma:**
- Calidad de las respuestas generativas (el modelo tiene más datos de entrenamiento en inglés que en la mayoría de idiomas)
- Reconocimiento de intenciones en topics con triggers de lenguaje natural
- Precisión en la extracción de entidades (fechas, números, nombres) en idiomas con estructuras gramaticales complejas

**Limitaciones a verificar antes de comprometerse:**
- Que el idioma objetivo soporta respuestas generativas (no todos los idiomas tienen esta capacidad activada)
- Que el reconocimiento de intenciones funciona con el vocabulario de tu dominio específico
- Que las Adaptive Cards se renderizan correctamente con textos en idiomas de derecha a izquierda (árabe, hebreo)

:::caution
Antes de prometer soporte en un idioma específico a stakeholders, haz pruebas reales con queries del dominio concreto. La calidad del español de España es diferente al español de México — y ambas son diferentes a inglés. No des por hecho que "funciona bien" sin evidencia empírica en tu contexto.
:::

## Consideraciones de diseño para agentes multilingüe

**System prompt en el idioma principal:** El system prompt del agente se escribe en el idioma principal. El modelo lo seguirá incluso cuando responda en un idioma secundario, pero la calidad de la interpretación de las instrucciones es mejor cuando el prompt y la respuesta están en el mismo idioma.

**Instrucción explícita de idioma:** Si tu agente tiene un idioma de respuesta preferido, inclúyelo explícitamente en el system prompt: "Responde siempre en el idioma en que te escriba el usuario. Si el idioma no es claro, responde en español." Esto evita respuestas en inglés cuando el usuario escribe en un idioma mixto.

**Prueba en el canal real:** La detección de idioma puede comportarse diferente en Teams vs web. Prueba en el canal donde estará desplegado el agente, no solo en el Test pane.

**Traducciones de Adaptive Cards:** Las Adaptive Cards requieren traducción manual de cada elemento textual. Si tu agente usa muchas Adaptive Cards, el mantenimiento multilingüe aumenta proporcionalmente. Considera si algunas tarjetas pueden simplificarse o eliminarse para los idiomas secundarios.

## Cuándo el multilingüe automático es suficiente

La IA generativa ha cambiado el umbral de lo que requiere configuración manual. Para agentes que:
- Responden principalmente a preguntas libres consultando knowledge sources
- Tienen pocos topics con mensajes manuales fijos
- Se despliegan en idiomas con buen soporte en el modelo base

...el soporte multilingüe funciona casi sin configuración adicional. El usuario escribe en su idioma y el agente responde en ese mismo idioma, consultando las mismas fuentes.

El trabajo manual (traducción de strings, pruebas por idioma) se concentra en los agentes con muchos mensajes fijos, flows con texto embebido, o idiomas que el modelo maneja con menor calidad.
