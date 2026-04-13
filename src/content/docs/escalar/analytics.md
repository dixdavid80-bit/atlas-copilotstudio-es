---
title: Analytics y evaluación
description: Métricas reales del dashboard nativo, conexión a Power BI y evaluación sistemática de la calidad del agente.
sidebar:
  order: 3
---

Medir un agente de IA es diferente a medir una aplicación tradicional. La pregunta no es "¿está disponible?" — esa es la métrica más fácil y la menos informativa. La pregunta relevante es "¿está respondiendo bien?". Y esa es mucho más difícil de responder, porque requiere una definición explícita de qué significa "bien" para tu caso de uso concreto.

## El dashboard nativo de Copilot Studio

Copilot Studio incluye un panel de analytics integrado accesible desde **Analytics** en el menú lateral del agente. Proporciona un primer vistazo útil sin configuración adicional:

### Métricas disponibles

| Métrica | Qué mide | Por qué importa |
|---------|---------|----------------|
| **Sesiones totales** | Número de conversaciones iniciadas | Adopción y volumen de uso |
| **Tasa de resolución** | % de conversaciones donde el usuario encontró lo que buscaba | La métrica más importante — indica si el agente resuelve el problema real |
| **Tasa de escalación** | % de conversaciones que acaban con un agente humano | Complementa la resolución — escalaciones altas indican gaps de conocimiento |
| **Topics activados** | Frecuencia de cada topic por conversación | Revela qué temas dominan el uso real |
| **Topics abandonados** | Flujos que el usuario empieza pero no completa | Señal de fricción o confusión en el flujo |
| **CSAT** | Puntuación de satisfacción directa | Si activas la encuesta al final de la sesión |

### El Activity Map

El Activity Map es la vista más útil para depuración. Muestra visualmente el recorrido de las conversaciones: qué topics se activaron, en qué punto los usuarios abandonaron, qué respuestas generaron seguimiento y cuáles cerraron la conversación. Es la diferencia entre saber que algo falla y saber exactamente dónde falla.

:::tip
Configura el tracking desde el primer día de producción. Los datos históricos no se recuperan retroactivamente — si esperas dos semanas para mirar las métricas, pierdes dos semanas de señales. El dashboard nativo es suficiente para las primeras semanas; añade Power BI cuando necesites cruzar datos o analizar tendencias largas.
:::

## Qué métricas importan de verdad

No todas las métricas del dashboard tienen el mismo valor operativo. Las que debes revisar cada semana:

**Tasa de resolución** — Si está por debajo del 60%, el agente tiene un problema fundamental: no está cubriendo los casos de uso reales de los usuarios. La causa puede ser topics mal definidos, knowledge sources desactualizadas o un sistema prompt que no orienta bien al modelo.

**Topics no reconocidos** — Las conversaciones donde el agente no encuentra ningún topic apropiado y cae en el fallback. Son oportunidades de mejora directas: cada consulta no reconocida es un caso de uso que el agente debería cubrir.

**Abandono por topic** — Un topic con alta tasa de abandono indica que los usuarios llegan hasta un punto y se van sin completar el flujo. Puede ser que la pregunta que hace el agente no es clara, que la Adaptive Card no funciona en ese canal, o que el usuario no tiene la información que el agente le pide.

**CSAT** — Útil como proxy de satisfacción general, pero hay que interpretarla en contexto. Un CSAT de 4/5 en un agente de soporte IT puede ser excelente; el mismo CSAT en un agente de asesoría fiscal puede ser preocupante.

## Power BI — análisis avanzado

El dashboard nativo de Copilot Studio es suficiente para el seguimiento operativo básico. Para análisis más profundo — tendencias largas, segmentación por usuario o departamento, cruce con métricas de negocio — necesitas exportar los datos a Power BI.

Copilot Studio permite conectar directamente con Dataverse, donde se almacenan los datos de conversación, para construir dashboards personalizados. Las métricas que merece la pena modelar en Power BI:

- **Coste por resolución**: cuántos mensajes equivalentes consume cada conversación resuelta
- **Distribución de temas por departamento**: qué áreas generan más volumen de consultas
- **Tiempo hasta resolución**: sesiones cortas vs largas y su correlación con satisfacción
- **Evolución de la tasa de resolución** con cada publicación del agente — para verificar que los cambios mejoran y no empeoran el rendimiento

:::caution
Los datos de conversación en Dataverse tienen políticas de retención que dependen de tu configuración de entorno. Si planeas análisis históricos, verifica la retención antes de asumir que los datos estarán disponibles en seis meses.
:::

## Evaluación sistemática — más allá del dashboard

El dashboard te dice qué pasa. La evaluación sistemática te dice por qué y si va a seguir pasando. La diferencia es metodológica.

### El pipeline de evaluación de 8 pasos (PAT-007)

Para agentes en entornos de alta criticidad o con cambios frecuentes, el pipeline de evaluación estructurado proporciona garantías que el dashboard no puede dar:

```
1. Definir dimensiones de calidad:
   - Groundedness: ¿la respuesta está respaldada por las fuentes?
   - Relevancia: ¿responde a lo que se preguntó?
   - Coherencia: ¿el flujo de conversación es lógico?
   - Completitud: ¿la respuesta es suficientemente completa?

2. Construir ground truth sintético:
   - Conjunto de preguntas representativas con respuestas esperadas
   - Incluir casos límite y consultas fuera de alcance

3. Configurar rúbrica de evaluación:
   - Escala 1-5 por dimensión con criterios explícitos

4. LLM-as-Judge:
   - Un modelo evalúa las respuestas del agente contra la rúbrica
   - Automatizable — no requiere evaluación humana por cada cambio

5. Automatizar en CI/CD:
   - Cada modificación del system prompt o topics dispara la evaluación
   - Los cambios que bajan métricas no pasan a producción

6. Umbrales de calidad:
   - Ejemplo: groundedness >= 4.0 para aprobar el despliegue

7. Monitorizar drift en producción:
   - Conversaciones reales vs ground truth — el comportamiento puede cambiar aunque no hayas tocado nada

8. Retroalimentar:
   - Los fallos en producción se convierten en nuevos casos del ground truth
```

:::tip
No necesitas implementar los 8 pasos desde el principio. Empieza con el ground truth (paso 2) y la rúbrica (paso 3). Aunque lo evalúes manualmente las primeras semanas, tener un conjunto de preguntas de referencia ya te da un instrumento para comparar versiones del agente de forma objetiva.
:::

### Evaluación en tres momentos

| Momento | Cuándo | Qué evalúa |
|---------|--------|-----------|
| **Offline (build/CI)** | Antes de publicar | Calidad del agente contra el ground truth |
| **Online (producción)** | Continuamente | Comportamiento real con usuarios reales |
| **In-the-loop (runtime)** | Por conversación | Para agentes de alta autonomía — guía decisiones en tiempo real |

Para la mayoría de los agentes de Copilot Studio, la evaluación offline antes de publicar y la revisión periódica de métricas online son suficientes. Los agentes de alta criticidad (toma de decisiones, acceso a datos financieros, asesoría regulatoria) merecen los tres niveles.

## Métricas de negocio — lo que realmente importa

Las métricas técnicas son instrumentales. Las que importan a los stakeholders del negocio son diferentes:

| Métrica de negocio | Cómo construirla |
|-------------------|-----------------|
| **Coste por consulta resuelta** | Coste mensual de créditos Copilot Studio ÷ consultas resueltas |
| **Desvío de tickets de soporte** | Comparar volumen de tickets antes y después del agente |
| **Tiempo ahorrado por usuario** | Encuesta periódica — cuánto tiempo les habría costado sin el agente |
| **Adopción** | % de usuarios objetivo que han interactuado al menos una vez en el mes |

Estas métricas son las que justifican la inversión y las que determinan si el proyecto continúa o se cancela. El dashboard de Copilot Studio no las proporciona directamente — necesitas combinar los datos de uso con fuentes de negocio externas.
