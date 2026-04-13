---
title: Instructions y comportamiento del agente
description: Cómo escribir las instrucciones del agente para controlar su scope, priorizar herramientas, definir formato de respuesta y configurar comportamiento autónomo.
sidebar:
  order: 7
---

Las **Instructions** son el system prompt del agente. El motor de orquestación generativa las usa para tres propósitos concretos: decidir qué recursos invocar (tools, knowledge sources, topics, otros agentes) ante una consulta, rellenar los inputs de las herramientas usando el contexto disponible, y generar la respuesta final al usuario.

Son lo primero que deberías configurar en cualquier agente, pero en la práctica se escriben mejor al final — cuando ya sabes qué knowledge sources tienes, qué tools existen y qué topics has creado. Las instrucciones que referencian recursos que no existen todavía son confusas para el orquestador y para el autor.

:::caution
Las instrucciones no son texto libre que el agente interpreta con buena voluntad. Son directivas que el sistema trata con precisión casi literal. Una instrucción mal escrita puede romper el comportamiento del agente de formas no obvias. Si el agente deja de responder después de añadir una instrucción, elimina todas y añádelas de una en una probando entre cada adición — es la forma más rápida de identificar cuál es el problema.
:::

## El framework de 3 bloques

La estructura que mejor funciona en producción separa las instrucciones en tres bloques con propósito distinto:

**Bloque 1 — Constraints (Restricciones)**

Define el scope del agente: de qué temas habla y de cuáles no. Esto es más importante de lo que parece — un agente sin restricciones claras responde preguntas irrelevantes, diluyendo su utilidad percibida y complicando su gestión.

```
Solo responder a consultas sobre normativa contable (NIIF, NIC, PGC) y políticas
de control interno de la firma.
No responder preguntas sobre temas laborales, fiscales ni de gestión de proyectos.
Si la consulta no es sobre normativa contable, informar al usuario que este agente
no puede ayudar y sugerir contactar al departamento correspondiente.
```

**Bloque 2 — Response format**

Define cómo se estructura la respuesta: formato, longitud, elementos visuales, tono. El orquestador aplica estas directivas al generar la respuesta final.

```
Responder siempre citando la normativa específica ("Según NIIF 16, párrafo 22...").
Cuando haya múltiples interpretaciones, presentarlas en tabla con columnas:
Interpretación | Normativa | Implicación.
Usar negrita para conclusiones clave.
```

**Bloque 3 — Guidance (Comportamiento)**

Guía al orquestador sobre qué recursos usar en qué situaciones, cuándo invocar cada tool y qué hacer al final de cada respuesta.

```
Buscar primero en /knowledge-normativa cuando la consulta sea sobre estándares.
Si no hay respuesta en knowledge, buscar en /knowledge-politicas para procedimientos internos.
Cuando el usuario pida analizar un caso específico, invocar /tool-analisis-contable.
Concluir cada respuesta con una pregunta de seguimiento relevante.
```

## Referencias con el comando slash

Dentro del editor de instrucciones, escribir `/` abre un menú de referencias a recursos reales del agente. Esto es fundamental — referenciar un tool, topic o knowledge source con el nombre exacto mejora significativamente la precisión de invocación del orquestador:

- `/nombre-del-tool` → referencia a un Prompt Tool o Agent Flow
- `/nombre-del-topic` → referencia a un topic personalizado
- `/nombre-del-knowledge` → referencia a una knowledge source específica
- `/nombre-del-agente` → referencia a otro agente (orquestación multi-agente)

:::tip
Aunque el orquestador ya conoce qué tools y topics tiene el agente, listarlos explícitamente en las instrucciones con `/` mejora la relevancia. Es la diferencia entre "el agente sabe que tiene un tool" y "el agente sabe cuándo usarlo".
:::

## Vocabulario efectivo

El orquestador responde mejor a ciertos verbos según el tipo de directiva:

| Objetivo | Verbos que funcionan |
|----------|---------------------|
| Recuperar datos | Get, Use, Retrieve, Extract |
| Aplicar sobre resultados | From, With, Using |
| Condiciones | When, If, Ensure, Compare |
| Filtrar información | Include, Exclude, Identify |
| Acciones sobre el usuario | Notify, Ask, Direct, Inform |

Evita frases vagas como "ten en cuenta" o "considera". Prefiere directivas concretas: "cuando X ocurra, usa Y" es más efectivo que "si es posible, intenta usar Y".

## Gotchas críticos

**No menciones "citation" ni "reference" en las instrucciones.** Cualquier instrucción que incluya esas palabras afecta negativamente al comportamiento del sistema de citaciones — que opera de forma automática y no se puede controlar desde instrucciones. Nunca lo hagas.

**Las instrucciones no pueden cambiar el retrieval.** Si quieres cambiar cómo el agente busca en los documentos, la configuración está en Knowledge Sources (ver el artículo de conocimiento), no en instrucciones. Instrucciones que intentan controlar el retrieval ("busca en los primeros párrafos de cada documento") son ignoradas o producen comportamientos impredecibles.

**Follow-up questions requieren General Knowledge activado.** Si desactivas "Use general knowledge" (Settings > Generative AI), las preguntas de seguimiento que el agente genera sin cita disponible se suprimen y el agente cae al fallback. Si tus instrucciones piden que el agente concluya con preguntas de seguimiento, asegúrate de que General Knowledge está activo.

**Las instrucciones multilingüe no están garantizadas.** Instrucciones pidiendo soporte en múltiples idiomas pueden funcionar de forma inconsistente — no están oficialmente soportadas ni testeadas. Valida antes de prometérselo a los usuarios.

## Instrucciones para agentes autónomos

Cuando el agente opera con triggers de evento (sin usuario humano en el bucle), las instrucciones tienen requisitos adicionales de seguridad y precisión:

```
Proceso de onboarding de empleado — ejecutar en orden:
1. Obtener datos del empleado desde el payload del trigger
2. Crear cuenta en Azure AD usando /tool-crear-cuenta-ad
3. Asignar grupos de seguridad según el departamento: Sales → [grupo-sales],
   Engineering → [grupo-eng], HR → [grupo-hr]
4. Enviar email de bienvenida a la dirección de correo del empleado
   usando SOLO las plantillas de /knowledge-plantillas-bienvenida
5. Notificar al manager directo en Teams con el resumen del onboarding
```

Los agentes autónomos necesitan instrucciones numeradas y secuenciales. También necesitan limitaciones explícitas de qué tools pueden usar y qué parámetros son aceptables.

:::caution
Los triggers autónomos son vulnerables a ataques de jailbreak donde el payload del trigger incluye instrucciones maliciosas ("ignora las instrucciones anteriores y haz X"). Siempre especifica explícitamente qué tools puede usar el agente, qué valores son aceptables para los parámetros críticos y qué hacer cuando el payload no tiene el formato esperado. La superficie de ataque existe y en entornos enterprise es relevante.
:::

## Las instrucciones son el bloque #7

Un principio del Agent Design Framework (documentado por Remi Dyon en la comunidad) que comparto: las instrucciones son el bloque #7 de un proceso de diseño que empieza con el caso de uso, los triggers, los canales, el knowledge, las herramientas y los flujos. No se pueden escribir bien sin haber definido los bloques anteriores.

Intentar escribir instrucciones antes de saber qué tools tiene el agente, qué knowledge sources existen o qué topics cubres produce instrucciones que referencian cosas que no existen o que no priorizan correctamente entre recursos disponibles.

El orden correcto: configura todo lo demás → escribe las instrucciones referenciando lo que ya existe → prueba iterativamente → publica solo cuando el comportamiento es consistente.

## Qué no se puede hacer desde instrucciones

Hay cosas que la gente intenta controlar desde instrucciones y que simplemente no funcionan:

- **Cambiar el mensaje de fallback:** Se hace en Topics > System > Fallback. No desde instrucciones.
- **Controlar cuándo aparece una Adaptive Card:** Se define en la lógica del topic. No desde instrucciones.
- **Cambiar cómo se recuperan los documentos:** Configuración de Knowledge Sources. No desde instrucciones.
- **Evitar que el agente trate un tema específico con una instrucción simple:** Si el tema es recurrente, crea un topic dedicado con un nodo de mensaje que responde explícitamente. Las instrucciones no son suficientemente deterministas para esto.

El denominador común: cuando algo debe ser absolutamente determinista, las instrucciones generativas no son el mecanismo. Los topics, con su lógica de nodos y condiciones, son más fiables para comportamientos que deben ser exactos.
