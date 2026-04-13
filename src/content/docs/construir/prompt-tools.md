---
title: Prompt Tools para razonamiento AI especializado
description: Cómo crear herramientas de razonamiento AI con instrucciones propias, modelo independiente y parámetros de entrada que el agente invoca cuando la situación lo requiere.
sidebar:
  order: 5
---

Las **Prompt Tools** son la respuesta de Copilot Studio a un problema real: las instrucciones generales del agente son buenas para definir comportamiento y tono, pero son un mecanismo pobre para aplicar razonamiento especializado sobre inputs dinámicos. Un agente que necesita analizar el texto de un contrato, clasificar una incidencia por severidad o extraer fechas clave de un documento necesita algo más que instrucciones generales — necesita un prompt con lógica dedicada, un modelo apropiado para la complejidad de la tarea y la capacidad de testear ese prompt de forma aislada.

Los Prompt Tools son exactamente eso: herramientas de razonamiento AI que el orquestador generativo del agente invoca cuando detecta que la intención del usuario encaja con lo que el tool hace. Tienen sus propias instrucciones, aceptan parámetros de entrada (texto, imágenes, documentos), usan un modelo AI que puede ser diferente al principal del agente y se pueden probar en el Prompt Builder antes de conectarlos.

El caso CS-005 (analizador de documentos) ilustra el valor: un Prompt Tool con instrucciones de analista documental experto que produce outputs estructurados — hallazgos codificados por severidad, riesgos con evidencia y probabilidad, obligaciones con fechas, recomendaciones priorizadas. El agente detecta la intención de análisis, invoca el Prompt Tool con el texto del documento como parámetro, y devuelve el resultado estructurado al usuario.

## Cómo crear un Prompt Tool

Hay dos puntos de creación, con diferente alcance:

**Como tool del agente** (recomendado para reutilización): En la pestaña **Tools** del agente > **Add a tool > New tool > Prompt**. El orquestador generativo lo tiene disponible para invocarlo en cualquier conversación cuando detecta la intención adecuada.

**Dentro de un topic**: En el canvas del topic > `+` > **Add a tool > New prompt**. Solo se ejecuta cuando ese topic específico se activa. Útil cuando el prompt tiene sentido únicamente en un flujo concreto.

También existe la opción global: **Tools > Add a tool > New tool > Prompt**. Los prompts creados aquí pueden reutilizarse entre varios agentes y flujos.

## Estructura de las instrucciones

El Prompt Builder ofrece tres formas de escribir las instrucciones: manual, con asistencia de Copilot (genera desde una descripción) o desde la librería de templates predefinidos.

Para tareas especializadas, la opción manual con una estructura clara produce los mejores resultados:

```
[Rol]
Eres un analista documental experto con experiencia en servicios profesionales.

[Tarea]
Tu tarea es analizar el texto del documento proporcionado y generar un
análisis estructurado con hallazgos, riesgos y recomendaciones.

[Instrucciones]
1. Lee el documento completo antes de generar ninguna sección
2. Clasifica cada hallazgo por severidad: Alta, Media, Baja
3. Para cada riesgo, identifica la evidencia textual específica
4. Extrae todas las fechas y obligaciones con vencimiento

[Formato de salida obligatorio]
### RESUMEN EJECUTIVO (3-5 oraciones)
### HALLAZGOS CLAVE (codificados H-001, H-002...)
### RIESGOS IDENTIFICADOS (codificados R-001, R-002...)
### OBLIGACIONES Y FECHAS CRÍTICAS (tabla)
### RECOMENDACIONES (codificadas REC-001...)

[Restricciones]
- Basa el análisis SOLO en el texto proporcionado
- No emitas opiniones legales ni fiscales
- Si la información es insuficiente, indícalo con "Información insuficiente para [sección]"
```

La última parte — la restricción de "salida de emergencia" — es importante. Sin ella, el modelo tiende a inventar contenido cuando la información del documento es escasa. Darle una alternativa explícita previene alucinaciones.

:::caution
**Copilot no puede mejorar un prompt existente.** El asistente de Copilot en el Prompt Builder solo genera instrucciones desde cero — no puede refinar ni mejorar un prompt que ya escribiste. Si quieres usar la asistencia de Copilot, úsala para el borrador inicial y luego edita manualmente.
:::

## Parámetros de entrada (inputs)

Para definir los parámetros que el prompt acepta: escribe `/` en el editor o selecciona **Add content**. Hay dos tipos:

- **Text:** Para contenido de documentos, queries, datos del usuario
- **Image or document:** Para imágenes o documentos que el modelo procesará visualmente

Cada input necesita un nombre descriptivo y datos de prueba representativos para poder testear el prompt antes de conectarlo. El input se referencia en las instrucciones con `{{nombre_input}}`:

```
## Texto del documento
{{document_text}}

Analiza el documento anterior y genera...
```

:::tip
Incluye datos de prueba realistas, no genéricos. Un prompt de análisis documental testeado con "Lorem ipsum" no te dice nada sobre cómo se comportará con un contrato real de 15 páginas. Usa fragmentos de documentos reales (anonimizados) para validar el comportamiento.
:::

## Selección de modelo: la decisión de coste vs. calidad

Esta es la decisión que más impacta en el coste de uso. Los modelos disponibles en Prompt Builder se agrupan en tres categorías:

| Categoría | Modelos | Cuándo usar |
|-----------|---------|-------------|
| **Mini (Basic)** | GPT-4.1 mini | La mayoría de tareas: resúmenes, clasificaciones, extracción estándar |
| **General (Standard)** | GPT-4.1, GPT-5 chat, Claude Sonnet 4.5 | Análisis de complejidad media, generación de contenido, razonamiento moderado |
| **Deep (Premium)** | GPT-5 reasoning, GPT-5.2 reasoning, Claude Opus 4.5 | Razonamiento profundo, análisis multi-variable, decisiones complejas |

El coste de Premium puede ser 10x mayor que Basic. La recomendación práctica: empieza siempre con GPT-4.1 mini. Solo escala si la calidad del output es insuficiente para la tarea concreta. En el caso CS-005, el analizador de documentos estándar funciona bien con Basic. Para contratos con cláusulas ambiguas complejas que requieren interpretación legal profunda, se justifica Standard.

Para conectar modelos externos de Azure AI Foundry (tu propio modelo desplegado): el `+` en el dropdown de Model > ingresar el deployment name y el base model name exactamente como aparecen en AI Foundry.

:::caution
**Temperature no disponible en modelos reasoning.** GPT-5 reasoning y similares no aceptan el parámetro de temperature — el slider se desactiva automáticamente. Estos modelos razonan internamente antes de responder y no permiten ajustar la aleatoriedad. Si diseñas tu prompt esperando controlar la temperatura, verifica que el modelo lo soporta.
:::

## Configuración del modelo

En la parte superior del editor, tres puntos `...` > **Settings**:

| Setting | Para qué sirve | Recomendación |
|---------|---------------|---------------|
| Temperature | Creatividad vs. determinismo (0 = predecible, 1 = creativo) | 0-0.3 para análisis y extracción. 0.5-0.8 para generación creativa |
| Record retrieval | Registros de knowledge sources a incluir | Deshabilitado si el prompt solo procesa el input — no traigas knowledge innecesaria |
| Include links | Citas en la respuesta | Solo si usas knowledge sources en el prompt |
| Code interpreter | El modelo puede ejecutar código | Solo si el prompt necesita cálculos o procesamiento de datos |
| Content moderation | Nivel de filtrado | Moderate para la mayoría de contenido profesional |

## Testear antes de conectar

El punto de testeo aislado es una de las ventajas clave de los Prompt Tools respecto a las instrucciones generales: puedes validar el comportamiento del prompt antes de conectarlo al agente.

En el editor, con los datos de prueba rellenados, selecciona **Test**. El editor genera la respuesta basándose en las instrucciones y los datos de prueba. Verifica que:

- La estructura de salida es exactamente la esperada
- Los datos extraídos son correctos y están en el formato correcto
- Las restricciones se respetan (el modelo no inventa cuando no tiene información)
- La respuesta tiene la granularidad correcta

Testea con al menos 3 inputs diferentes antes de declararlo listo. Un prompt que funciona con un documento concreto pero falla con otro necesita instrucciones más robustas o ejemplos adicionales.

## Conectar el Prompt Tool al agente

Una vez guardado, referenciarlo en las instrucciones del agente para que el orquestador sepa cuándo invocarlo:

```
Cuando el usuario proporcione texto de un documento para analizar:
1. Ejecuta el prompt /Analizador-de-Documentos con el texto como parámetro document_text
2. Presenta el resultado tal como lo devuelve el prompt
3. Pregunta si quiere profundizar en alguna sección específica
```

El nombre exacto con `/` mejora la precisión de invocación. El orquestador también usa el nombre y la descripción del tool para decidir cuándo invocarlo — una buena descripción incluye cuándo SÍ y cuándo NO debería activarse este prompt.

:::tip
En M365 Copilot, el comando `-developer on` en el chat activa el Developer Mode: muestra qué tool se invocó, qué parámetros se pasaron y el tiempo de ejecución. Es la herramienta más útil para verificar que el orquestador está invocando el Prompt Tool con los inputs correctos.
:::

## Prompt Tool vs. Instructions: la distinción que más confunde

Las instrucciones del agente (ver el artículo sobre instrucciones) definen el comportamiento general: qué temas cubre el agente, qué tono usa, cómo prioriza las fuentes de conocimiento. Los Prompt Tools son herramientas especializadas invocadas bajo demanda para tareas concretas.

No pongas lógica de prompt compleja en las instrucciones generales. Si el razonamiento tiene sus propios parámetros de entrada, necesita un modelo específico o tiene una estructura de salida definida, merece ser un Prompt Tool dedicado. Las instrucciones largas y complejas son más difíciles de mantener, más difíciles de testear y generan comportamientos impredecibles cuando el agente tiene muchas instrucciones compitiendo.
