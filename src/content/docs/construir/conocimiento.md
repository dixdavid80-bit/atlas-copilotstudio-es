---
title: Knowledge Sources y orquestación generativa
description: Cómo alimentar a tu agente con fuentes de conocimiento reales y dejar que el orquestador generativo decida qué consultar en cada turno.
sidebar:
  order: 1
---

Las **Knowledge Sources** son la columna vertebral de cualquier agente que necesite responder con información real en lugar de generalidades. Combinadas con la **Generative Orchestration**, permiten que el agente razone sobre qué fuente consultar en cada momento — sin reglas fijas, sin mapeos manuales de preguntas a respuestas.

El caso CS-001 ilustra el problema de partida: la normativa interna de una organización vive en SharePoint, PDFs que circulan por correo y sitios web regulatorios. Los empleados pierden 5-6 horas semanales buscando en tres sitios distintos. Un agente con tres knowledge sources bien configuradas resuelve eso en una pregunta.

## Modos de orquestación: Classic vs Generative

Todo empieza aquí. Antes de añadir una sola fuente de conocimiento, tienes que decidir en qué modo opera tu agente.

**Classic Orchestration** es el modo heredado: el agente sigue reglas fijas, los topics se activan por frases exactas, y las knowledge sources se invocan como fallback cuando ningún topic responde. Es predecible, pero rígido. Los límites son estrictos: 4 fuentes SharePoint, 4 sitios web, 2 de Dataverse.

**Generative Orchestration** es donde deberías estar en 2026. El agente usa IA generativa para decidir dinámicamente qué resources invocar — topics, tools, knowledge sources — basándose en el contexto completo de la conversación. Los límites suben drásticamente: hasta 25 sources en total (SharePoint, web, Dataverse, Azure OpenAI). Los archivos subidos directamente no cuentan para ese límite.

Para activarlo: **Settings > Generative AI > Orchestration mode > Generative**.

:::tip
Activa Generative Orchestration desde el principio, aunque tu agente sea sencillo. Migrar después es trivial, pero los hábitos de configuración (trigger descriptions vs. trigger phrases) son distintos y crean deuda técnica si los mezclas.
:::

## Tipos de fuentes disponibles

| Tipo | Límite (Generative) | Mejor para |
|------|---------------------|------------|
| SharePoint URLs | 25 total | Políticas internas, manuales actualizados frecuentemente |
| Archivos subidos | Sin límite | PDFs estáticos, normativas que no cambian |
| Website URLs | 25 total | FAQs públicas, documentación externa |
| Dataverse | 25 total | Datos estructurados relacionales |
| Azure OpenAI | 25 total | RAG personalizado con control del retrieval |

La distinción entre SharePoint y archivos subidos es importante en la práctica. Los archivos subidos son estáticos — si el PDF cambia, tienes que volver a subirlo. Las URLs de SharePoint se re-indexan automáticamente cuando el documento se actualiza. Para normativa viva, siempre SharePoint.

## El detalle que más importa: las descripciones

Aquí está el punto que más gente ignora y que más afecta al comportamiento real del agente.

Cuando tienes más de 25 knowledge sources — o cuando el agente necesita elegir entre fuentes de temática similar — Copilot Studio usa un GPT interno para filtrar qué fuentes son relevantes para cada consulta. Ese GPT lee las **descripciones** de las sources para decidir. Si tus descripciones dicen "Documentos 1" y "Documentos 2", ese GPT no puede distinguirlas.

Una buena descripción incluye cuándo SÍ usar la fuente y cuándo NO:

```
Nombre: Normativa NIIF
Descripción: Contiene normas internacionales de información financiera (NIIF/IFRS).
Usar para consultas sobre reconocimiento de ingresos, arrendamientos e instrumentos
financieros. NO usar para normativa fiscal española ni para políticas internas de la firma.
```

Las negaciones son tan importantes como las afirmaciones. Reducen los falsos positivos — que el agente busque en la fuente equivocada — de forma significativa.

## Configuración del conocimiento: dos decisiones críticas

**Web Search (Grounding with Bing):** Permite que el agente complemente sus fuentes con búsquedas en internet. Se ejecuta en paralelo con las sources configuradas. Útil para información actualizada; problemático si trabajas con datos confidenciales (las queries van a Bing).

**General Knowledge:** Controla si el agente puede usar el conocimiento general del modelo cuando sus fuentes no tienen la respuesta. Deshabilitarlo hace que el agente se limite estrictamente a tus fuentes — ideal para entornos enterprise donde la precisión importa más que la cobertura. El efecto secundario: sin General Knowledge, las preguntas de seguimiento sin cita disponible se suprimen y el agente cae al fallback.

Para agentes enterprise, la configuración que recomiendo:

| Setting | Valor | Motivo |
|---------|-------|--------|
| General Knowledge | Deshabilitado | El agente solo responde con tus datos |
| Web Search | Deshabilitado | Evita enviar queries a Bing en entornos confidenciales |
| Descripciones de sources | Siempre con negaciones | Reduce routing incorrecto entre fuentes similares |

## Generative Answers dentro de un topic

Existe un patrón menos obvio: el nodo **Create generative answers** dentro de un topic. Permite invocar knowledge sources de forma explícita cuando el usuario expresa una intención específica, en lugar de dejar que el orquestador lo decida de forma autónoma.

:::caution
Aunque tu agente opere en modo Generative, el nodo "Create generative answers" dentro de un topic usa **Classic orchestration internamente**. Eso significa que el límite de public website sources baja a 4 en ese nodo, aunque tengas 25 configuradas globalmente. Es una de las inconsistencias más confusas de la plataforma.
:::

El patrón tiene su utilidad: cuando necesitas que cierta intención siempre busque en fuentes específicas, independientemente de lo que decida el orquestador global. El caso CS-001 lo usa para garantizar que las consultas de compliance siempre busquen en el PDF del manual, no en el SharePoint de RRHH.

## Gotchas reales en producción

**Bing Custom Search y Custom Data no funcionan en modo Generative.** Estas fuentes solo están disponibles en Classic o dentro de un generative answers node en un topic. Si las tenías configuradas y migras a Generative, desaparecen de la orquestación principal.

**Los archivos subidos no cuentan para el límite de 25** — pero sí cuentan cuando haces búsqueda en el nodo generative answers. La distinción es sutil y genera confusión en auditorías de configuración.

**El trigger OnKnowledgeRequested** permite interceptar el proceso de retrieval e integrar tu propio API de búsqueda. Es advanced mode — no lo necesitas para la mayoría de casos, pero existe si necesitas más control sobre cómo se recupera la información (el GAF-001 documenta el setup de búsqueda híbrida con Azure AI Search para casos que lo requieren).

## Cuándo Knowledge Sources NO es la respuesta

Las Knowledge Sources son ideales para información en documentos. No son la herramienta correcta para:

- **Datos transaccionales en tiempo real**: El inventario de hoy, el estado de un ticket, los registros de un empleado. Para eso necesitas Tools/Connectors que consulten el sistema de origen directamente (ver CS-004 sobre buscador de datos en tiempo real).
- **Respuestas siempre iguales**: Un topic con mensaje fijo es más predecible y más barato.
- **Lógica determinista**: Si la respuesta depende de condiciones exactas, usa Topics + Power Fx (ver el artículo siguiente).

El agente del caso CS-001 funciona porque la normativa interna es texto en documentos. Si en lugar de políticas de RRHH necesitaras consultar el estado de las vacaciones de un empleado en tiempo real, el arquitectura sería completamente diferente.
