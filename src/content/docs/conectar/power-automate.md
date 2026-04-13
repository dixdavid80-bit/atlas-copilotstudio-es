---
title: Power Automate
description: Cómo integrar cloud flows y Agent Flows para que tu agente ejecute acciones reales en sistemas externos.
sidebar:
  order: 1
---

Power Automate es la integración más importante de Copilot Studio. Sin ella, el agente conversa. Con ella, **actúa**: crea tickets, consulta inventario en tiempo real, envía notificaciones, actualiza registros en CRM. Esta sección cubre las dos direcciones del vínculo y el patrón batch que aparece en casi todos los casos de uso avanzados.

## Dos sabores de automatización nativa

Antes de hablar de integración, conviene distinguir dos cosas que Copilot Studio llama de forma parecida:

| Tipo | Qué es | Licencia | Cuándo usar |
|------|--------|----------|-------------|
| **Agent Flows** | Flujos deterministas nativos de CS, diseñados dentro del agente | Incluida en CS | Automatizaciones simples sin dependencias premium |
| **Cloud Flows como Tool** | Flujos de Power Automate registrados como herramienta del agente | Requiere PA | Conectores premium (SAP, Salesforce), lógica compleja, múltiples sistemas |

El caso CS-006 (gestor de solicitudes) usa Agent Flows: el agente consulta SharePoint, envía un email vía Outlook y confirma al usuario, todo dentro de la misma conversación, sin licencia adicional. Es el punto de entrada natural.

Los cloud flows como Tool son el paso siguiente: más potentes, más costosos, y necesarios cuando el caso lo justifica.

---

## Cloud Flows como Tool — Cómo funciona

La integración se establece con un contrato bidireccional entre el agente y el flow:

```
Agente → invoca el flow → [trigger: "When an agent calls the flow"]
       ← recibe respuesta ← [acción: "Respond to the agent"]
```

El flow actúa como una caja negra para el agente: recibe inputs tipados, ejecuta su lógica, y devuelve outputs. El agente no sabe qué hace el flow internamente.

### Requisitos del flow

Para que un cloud flow funcione como Tool del agente:

1. **Trigger**: "When an agent calls the flow" — no vale ningún otro disparador
2. **Acción final**: "Respond to the agent" — con outputs explícitos y con `Asynchronous Response: Off`
3. **Ubicación**: dentro de una **Solution** del mismo entorno que el agente — los flows en "My flows" son invisibles para CS

:::caution
Si `Asynchronous Response` está en `On` en la acción "Respond to the agent", el agente recibirá error 3000 ("Something unexpected happened"). Este es el gotcha más frecuente al reutilizar flows existentes.
:::

### Tipos de datos soportados

Solo tres tipos en inputs y outputs: **Text**, **Number** y **Yes/No (Boolean)**. No se pueden pasar arrays, objetos JSON ni archivos directamente. Para datos complejos, serializar a string y parsear con `json()` dentro del flow.

### El límite de 100 segundos

El flow tiene 100 segundos (en la práctica ~2 minutos) para responder al agente. Si se excede: error `FlowActionTimedOut`. Estrategias para no superarlo:

- **Express Mode** (si el entorno lo soporta): reduce tiempos significativamente en flows con lógica pesada y poca transferencia de datos
- **Mover lógica post-respuesta**: cualquier acción que no afecte el resultado puede colocarse *después* de "Respond to the agent" — el flow sigue ejecutándose hasta 30 días, pero el agente ya tiene su respuesta
- **HTTP Request node**: si solo necesitas una llamada HTTP simple, el nodo HTTP directo en Copilot Studio es más ligero y rápido que un flow completo

---

## Registro como Tool y descripción para el orquestador

Hay dos formas de registrar un flow como Tool:

- **Desde Copilot Studio**: `Add node > Add a tool > New Agent flow` — abre PA con la plantilla correcta y lo registra automáticamente
- **Desde Power Automate**: crear el flow manualmente y luego ir a `Copilot Studio > Tools > Add a tool > buscar el flow`

Una vez registrado, la **descripción del tool es crítica** cuando usas Generative Orchestration. El orquestador lee esa descripción para decidir cuándo invocarlo. Una descripción pobre genera invocaciones incorrectas o nulas.

:::tip
Incluye siempre "cuándo SÍ" y "cuándo NO" en la descripción del tool. Si tienes múltiples tools con funciones similares, las descripciones negativas son lo que evita que el orquestador elija el equivocado.

Ejemplo bien escrito:
```
Busca el CIF de una empresa española en fuentes públicas (BORME, Registro Mercantil).
Usar cuando el usuario pida el CIF, NIF o identificación fiscal de una empresa española.
NO usar para empresas de otros países ni para consultas no relacionadas con identificación fiscal.
```
:::

---

## El patrón Parent-Child para procesamiento batch

Cuando el agente necesita procesar decenas o cientos de registros (no uno a uno conversacionalmente), el patrón Parent-Child es la arquitectura estándar:

```
Parent Flow (orquestador)
  └── Get items (SharePoint/Dataverse, Filter: Status = 'Pending')
  └── Apply to Each [Concurrency: 5]
        └── Run a Child Flow (por cada registro)
              └── [lógica de procesamiento individual]
              └── Respond to a PowerApp or flow
```

**Por qué separar en dos flows**: el child es una unidad aislada — se puede testear independientemente, reutilizar desde múltiples parents, y un fallo en un child no detiene el batch completo.

### Reglas del patrón

- Ambos flows **deben estar en la misma Solution** — este es el error más común; crear los flows fuera de una Solution y moverlos después genera problemas
- El child debe tener trigger **"Manually trigger a flow"** — es el único compatible con "Run a Child Flow"
- El child debe incluir **"Respond to a PowerApp or flow"** al final — obligatorio para que el parent reciba la respuesta
- Configurar en el child `Run only users > Edit > todas las conexiones en "Use this connection"` — sin esto: error `child workflows only support embedded connections`

### Concurrencia recomendada

| Batch | Concurrencia | Tiempo estimado |
|-------|-------------|-----------------|
| 5 items | 5 | ~20 seg |
| 20 items | 5 | ~1 min |
| 50 items | 5 | ~3-4 min |
| 100 items | 5 | ~7-10 min |

No superar concurrencia 10 sin validar. Los conectores tienen límites: SharePoint 600 req/min, Copilot Studio 300 req/min. El exceso genera errores 429.

---

## Invocar el agente desde Power Automate

El camino inverso también es posible: Power Automate llama al agente como paso inteligente dentro de un flow. El conector **Microsoft Copilot Studio** expone dos acciones:

| Acción | Comportamiento | Usa cuando |
|--------|----------------|------------|
| **Execute Agent** | Fire-and-forget, solo devuelve ConversationId | No necesitas la respuesta |
| **Execute Agent and wait** | Espera respuesta completa | Casi siempre este |

El agente debe estar **publicado** antes de aparecer en el dropdown. Cada vez que modificas el agente, hay que re-publicarlo para que PA use la versión actualizada.

### Parsear la respuesta del agente

La respuesta tiene esta estructura:

```json
{
  "responses": ["respuesta del agente en texto"],
  "lastResponse": "respuesta del agente en texto",
  "conversationId": "abc123-..."
}
```

`responses` es un **array** — si lo usas directamente en dynamic content, Power Automate aplica un "Apply to each" automático. Para evitarlo: `first(body('Execute_Agent_and_wait')?['responses'])`.

Si el agente devuelve JSON, el modelo de lenguaje a veces lo envuelve en backticks markdown. La expresión blindada que funciona siempre:

```
json(trim(replace(replace(first(body('Execute_Agent_and_wait')?['responses']), '```json', ''), '```', '')))
```

:::tip
Usa siempre la expresión blindada aunque el agente hoy devuelva JSON limpio. Después de una actualización del modelo podría empezar a añadir backticks. La expresión funciona igual con o sin ellos.
:::

---

## Ejemplo real: extracción batch de CIF (DT-005)

Un equipo de Deals & Transactions necesita el CIF de 100 empresas españolas para due diligence. Manualmente: 3-5 minutos por empresa, 8 horas en total, 5-10% de errores de transcripción.

**Arquitectura implementada:**

```
SharePoint List (CompanyName | Status | CIF)
  ↓
Parent Flow → Get Items (Status = 'Pending') → Apply to Each (Concurrency: 5)
  ↓
Child Flow → Execute Agent and wait (CIF Lookup Agent)
  ↓
Parse JSON (expresión blindada) → Validar formato CIF → Update SharePoint
```

El agente devuelve:
```json
{
  "company_name": "Telefónica, S.A.",
  "cif": "A28015865",
  "source": "BORME / Registro Mercantil de Madrid",
  "confidence": "HIGH",
  "notes": ""
}
```

Resultados reales:

| Métrica | Manual | Automatizado | Mejora |
|---------|--------|-------------|--------|
| Tiempo por empresa | 3-5 min | ~20 seg | -93% |
| 100 empresas | 8 horas | ~10 min | -98% |
| Errores de transcripción | 5-10% | 0% | -100% |

---

## Configuración recomendada en producción

| Setting | Valor | Motivo |
|---------|-------|--------|
| Asynchronous Response | **Off** | Obligatorio — On genera error 3000 |
| Express Mode | **On** si disponible | Reduce tiempos en flows de lógica pesada |
| Concurrencia Apply to Each | **5** (ajustar tras validar) | Balance velocidad / throttling |
| Timeout acciones HTTP | **30 seg** | Deja margen para el límite global de 100s |
| Retry policy conectores | Fixed, 2 reintentos, intervalo 10s | Resiliencia ante errores transitorios |
| Credenciales del flow | Use this connection (maker) | Evita pedir credenciales al usuario |
| Run-only permissions child | Configurar explícitamente | Evita el error de embedded connections |
| Plan del propietario del flow | Copilot Studio (no PA Premium) | Para que el flow consuma créditos CS, no licencia PA |
