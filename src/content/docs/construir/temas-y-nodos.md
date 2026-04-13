---
title: Topics, triggers y flujo conversacional
description: Cómo estructurar la lógica de conversación con topics, activar el flujo correcto en el momento correcto y pasar contexto entre partes del agente.
sidebar:
  order: 2
---

Los **Topics** son la unidad básica de lógica conversacional en Copilot Studio. Cada topic define un camino de conversación con un trigger que lo activa, nodos que ejecutan la lógica, variables que almacenan datos y condiciones que ramifican el flujo. Son la forma de decirle al agente "cuando el usuario quiera X, haz Y en este orden".

El caso CS-002 ilustra por qué esto importa: un router inteligente de consultas que clasifica automáticamente si una petición es de Soporte TI, RRHH o Instalaciones — sin depender de palabras clave exactas, con lógica condicional que distingue severidad y con contexto que persiste cuando el usuario cambia de tema.

## Tipos de topics

Hay dos categorías que conviene distinguir desde el principio:

**Custom topics:** Los que tú creas. Son la lógica de negocio del agente. Cada topic tiene un propósito específico: clasificar una consulta, recopilar datos, responder sobre un tema concreto, ejecutar una acción.

**System topics:** Los predefinidos por Copilot Studio. No se pueden borrar: On Error, Escalate, End of Conversation, Fallback, Greeting. Sí se pueden personalizar sus nodos internos. Mi recomendación: no los toques hasta que domines los custom topics. El Fallback es el que más conviene personalizar — el mensaje por defecto es genérico y no refleja la identidad del agente.

## Crear un topic: dos caminos

**Desde cero (From blank):** Control total. Empieza con un nodo Trigger vacío y construyes el flujo tú. Obligatorio para topics con lógica determinista — clasificaciones, routing, validaciones donde el flujo debe ser exacto.

**Desde descripción con Copilot:** Describes en lenguaje natural lo que quieres y Copilot genera una primera versión con nodos de pregunta, condiciones y mensajes. Ahorra tiempo para topics conversacionales simples (FAQs, recopilación de datos básicos). La IA genera un punto de partida decente pero rara vez acierta al 100% con la lógica de negocio. Trátalo como borrador, no como resultado final.

:::caution
Nunca uses puntos (`.`) en los nombres de los topics. Copilot Studio los permite, pero impiden exportar la solución como paquete. Es un bug conocido que no tiene workaround — el exportador falla silenciosamente y pierdes horas investigando por qué.
:::

## Triggers: el corazón de la activación

El trigger determina cuándo se activa un topic. La elección del tipo de trigger cambia radicalmente según el modo de orquestación del agente.

### En modo Generative (el modo correcto)

El trigger por defecto es **"The agent chooses"**. El orquestador generativo lee la **descripción** del trigger para decidir si este topic es el correcto para la consulta actual.

Una buena descripción de trigger en modo Generative no es una lista de palabras clave. Es una explicación del propósito del topic, las situaciones que lo deben activar y las que no:

```
Este topic clasifica consultas de soporte técnico por severidad.
Activar cuando el usuario reporte problemas con hardware, software, accesos o red.
Incluye: errores de aplicación, dispositivos que no funcionan, problemas de VPN.
NO activar para consultas de RRHH, instalaciones o preguntas administrativas.
```

La clave es la parte negativa. Sin "NO activar para X", el orquestador a veces activa el topic para consultas adyacentes que encajan vagamente con la descripción positiva.

### En modo Classic

El trigger es **"User says a phrase"**. El agente compara el mensaje del usuario contra una lista de frases de trigger usando NLU. Necesitas entre 5 y 10 frases representativas, cortas y con variaciones naturales. No oraciones completas.

### Otros triggers disponibles

| Trigger | Cuándo usarlo |
|---------|--------------|
| A message is received | Interceptar cualquier mensaje — útil para logging o preprocesamiento global |
| A custom client event occurs | Responder a eventos del canal (botón pulsado en una Adaptive Card) |
| It's redirected to | El topic solo se activa cuando otro topic lo llama explícitamente |
| The user is inactive | Tras un período de inactividad — mensajes de "¿sigues ahí?" |
| A plan completes | Solo en modo Generative — tras ejecutar todas las acciones planificadas |
| An AI-generated response is about to be sent | Solo en modo Generative — para filtrar o modificar respuestas antes de enviarlas |

### Prioridad de ejecución

Cuando múltiples triggers pueden activarse para la misma actividad, el orden es:
1. **An activity occurs** (más genérico, se ejecuta primero)
2. **A message is received / A custom client event**
3. **The agent chooses / User says a phrase** (más específico, último)

Si hay empate entre triggers del mismo tipo, gana el más antiguo. Usa la propiedad **Priority** para controlar el orden explícitamente cuando necesites garantías.

## Variables y scope

Las variables almacenan datos durante la conversación. Hay cuatro niveles de scope que conviene entender bien:

| Scope | Prefijo | Alcance | Cuándo usarlo |
|-------|---------|---------|---------------|
| Topic | `Topic.` | Solo este topic | Datos temporales del flujo actual |
| Global | `Global.` | Todos los topics | Datos que persisten entre topics |
| System | `System.` | Todos los topics, solo lectura | Contexto del sistema (canal, usuario) |
| Environment | `Environment.` | Todos los agentes del entorno | Config compartida entre agentes |

**Convención de nombres:** Prefijo `Var` seguido de nombre descriptivo en camelCase: `VarTipoConsulta`, `VarSeveridad`, `VarNombreUsuario`. Facilita distinguirlas de variables de sistema en las fórmulas.

:::tip
En el panel de Test puedes ver todas las variables activas pasando el cursor sobre ellas. Es la forma más rápida de debuggear por qué un condicional toma la rama equivocada — ver el valor real de la variable antes de la condición.
:::

### Pasar datos entre topics

Cuando un topic redirige a otro, puede pasar variables como parámetros. El topic destino debe tener la variable marcada como **"Receive values from other topics"** — esto evita que el agente repita preguntas que ya contestó en el topic anterior. El caso CS-002 usa esto intensivamente: el topic de clasificación pasa el tipo de consulta y la severidad a los topics de departamento, que no vuelven a preguntar nada que ya se sabe.

## Condiciones y ramificaciones

Los nodos **Condition** crean bifurcaciones if/else basadas en valores de variables. Hay dos modos:

**Editor visual (Builder):** Para comparaciones simples de una variable contra un valor. La primera condición que sea true es la que se ejecuta. La rama "All Other Conditions" siempre debe quedar a la derecha — es el else.

**Formula (Power Fx):** Para condiciones compuestas (OR/AND múltiples), comparaciones con funciones o lógica que el editor visual no permite. La fórmula debe devolver un Boolean.

Un error frecuente: añadir una rama else-if seleccionando `+` **debajo** de una condición existente en lugar de **encima**. El primero crea un grupo de condiciones completamente nuevo (otro if/else independiente). El segundo añade una rama al grupo actual. La diferencia es visual pero el comportamiento es completamente distinto.

## Redirects: composición de topics

Los topics se pueden conectar mediante nodos **Redirect** (Topic management). Un topic puede llamar a otro, pasarle variables y recibir el control de vuelta cuando termina. Esto permite composición: topics pequeños y reutilizables que hacen una cosa bien, combinados desde un topic coordinador.

El caso CS-002 aplica este patrón: un topic de clasificación principal redirige a topics de departamento específicos. Cada topic de departamento tiene su propia lógica de severidad y respuesta. El topic coordinador no necesita saber nada de esa lógica interna.

## Generative Answers como fallback

Cuando ningún topic se activa — porque la consulta no encaja con ninguna descripción de trigger — el agente tiene dos opciones: caer al system topic "Fallback" (un mensaje de error genérico) o invocar Generative Answers para intentar responder con las knowledge sources configuradas.

Esta segunda opción es el patrón correcto para la mayoría de agentes: los topics cubren los flujos que necesitan lógica determinista, y Generative Answers cubre el resto con información de los documentos. El caso CS-002 lo implementa así: cuatro topics para las intenciones conocidas, Generative Answers para todo lo demás.

## La diferencia que cambia la arquitectura

Topics vs. Knowledge Sources no es una elección arbitraria. Topics cuando necesitas control exacto del flujo, validaciones, variables con scope, condiciones deterministas o pasar datos a herramientas externas. Knowledge Sources cuando la respuesta está en documentos y el agente puede encontrarla por búsqueda semántica sin lógica adicional.

La combinación de ambas — topics para el flujo, knowledge sources para el conocimiento — es el patrón que aparece en prácticamente todos los agentes de producción bien diseñados.
