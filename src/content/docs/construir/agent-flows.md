---
title: Agent Flows para automatización determinista
description: Cómo construir flujos de automatización nativos de Copilot Studio que se invocan como herramientas del agente sin necesitar licencia adicional de Power Automate.
sidebar:
  order: 6
---

Los **Agent Flows** son flujos de automatización propios de Copilot Studio. Se crean dentro de la plataforma, se invocan como herramientas del agente durante una conversación y se facturan con los créditos de Copilot Studio — sin necesitar licencia adicional de Power Automate. Son la opción para la lógica determinista que el agente necesita ejecutar: validaciones, transformaciones de datos, llamadas a APIs, operaciones sobre SharePoint o Dataverse.

La distinción con los Cloud Flows de Power Automate importa en la práctica. Los Cloud Flows requieren el trigger "When an agent calls the flow" y la acción "Respond to the agent" para comunicarse con Copilot Studio, además de licencia de Power Automate. Los Agent Flows eliminan esa fricción: se diseñan directamente en el canvas de Copilot Studio y tienen acceso nativo al contexto del agente.

El caso CS-006 (gestor de solicitudes automatizado) ilustra el uso central: cuando el usuario completa el formulario de Adaptive Card del intake, un Agent Flow toma los datos capturados, crea el registro en SharePoint, envía la notificación al responsable en Teams y devuelve el ID de la solicitud al agente — todo en menos de 10 segundos, sin intervención humana para la parte operativa.

## Agent Flows vs. Cloud Flows: cuándo usar cada uno

Esta tabla clarifica la decisión antes de empezar a construir:

| Criterio | Agent Flow | Cloud Flow (Power Automate) |
|----------|-----------|--------------------------|
| Licencia | Incluido en Copilot Studio | Requiere licencia de Power Automate |
| Creación | Nativa en Copilot Studio | En Power Automate portal |
| Conectores premium | Disponibles | Disponibles |
| Desktop flows (RPA) | No soportado | Sí soportado |
| Compartir / co-owners | No disponible | Sí disponible |
| Permisos run-only | No disponible | Sí disponible |
| Complejidad máxima | Media — flujos enfocados | Alta — orquestaciones multi-sistema |
| Express Mode | Sí (preview) | No aplica |

La regla práctica: si la automatización es intrínseca al flujo conversacional del agente y no requiere compartirse con otros usuarios o integrarse con sistemas que no tienen conector disponible en Agent Flows, elige Agent Flow. Si necesitas desktop flows (RPA), aprobaciones con routing complejo multi-nivel o compartir el flujo entre equipos, Cloud Flow.

:::caution
**La conversión de Cloud Flow a Agent Flow es irreversible.** Puedes migrar un cloud flow existente desde Power Automate (Edit > cambiar plan a Copilot Studio), pero no puedes revertirlo. Esto cambia la facturación permanentemente. Prueba siempre en un entorno de desarrollo antes de migrar flujos de producción.
:::

## Crear un Agent Flow

**Desde lenguaje natural** (recomendado para empezar): En Copilot Studio, navega a **Flows** > describe en el cuadro de texto lo que necesitas. Copilot genera un flujo con trigger y acciones. Usa el formato "Cuando X ocurra, haz Y" — "Cuando el agente envíe el nombre de un documento, léelo en SharePoint y devuelve su categoría". Revisa la propuesta y selecciona **Keep it and continue** para pasar al designer visual.

**Desde el designer visual** (para control total): **Flows > + New flow**. Canvas visual con trigger vacío. Construyes el flujo arrastrando componentes.

## El trigger correcto para herramientas del agente

Para flujos que el agente invocará durante una conversación, el trigger es **"Run a flow from Copilot"** (también llamado "When an agent calls the flow").

Al configurar el trigger, defines los **inputs** que el agente pasará al flujo:

```
Input: nombreArchivo
Tipo: Text
Descripción: "Nombre del archivo incluyendo extensión,
              tal como lo menciona el usuario en la conversación"

Input: sitioSharePoint
Tipo: Text
Descripción: "URL del sitio de SharePoint donde vive el data room"
```

:::tip
La descripción de los inputs no es decorativa. El orquestador generativo del agente la lee para decidir qué valores del contexto de la conversación mapear a cada input. Una descripción vaga genera inputs incorrectos. Una descripción precisa ("nombre del archivo incluyendo extensión") hace que el orquestador extraiga exactamente lo correcto.
:::

## Estructura de un Agent Flow típico

El patrón fundamental es **Input → Transformación → Output**:

```
TRIGGER: Run a flow from Copilot
  Inputs: nombreArchivo (Text), tipoOperacion (Text)

ACTION 1: SharePoint — Get file metadata using path
  → Obtiene ID, metadatos, fecha del archivo

ACTION 2: Run a prompt — Clasificar documento
  Instrucciones: "Basándote en el nombre y metadatos,
                  clasifica en: Financiero / Legal / Operativo /
                  Fiscal / RRHH / Comercial. Solo devuelve la categoría."
  → Obtiene: categoriaDocumento (Text)

ACTION 3: Condition — Verificar categoría válida
  Si categoría ∈ lista válida: continuar
  Sino: asignar "Otros"

ACTION 4: SharePoint — Move file
  Origen: /Inbox/[nombreArchivo]
  Destino: /[categoriaDocumento]/[nombreArchivo]

ACTION 5: SharePoint — Update file properties
  Propiedades: Categoria, FechaClasificacion, ClasificadoPor

ACTION 6: Respond to the agent
  Outputs:
    - categoriaAsignada: [resultado de ACTION 2]
    - rutaDestino: "/[categoriaDocumento]/[nombreArchivo]"
    - mensaje: "Documento clasificado y movido correctamente"
```

## Devolver datos al agente: Respond to agent

La acción **Respond to the agent** (o "Respond to Copilot") es la última acción del flujo cuando el agente necesita los resultados. Define los outputs que el agente recibirá: nombre, tipo y valor mapeado desde las variables del flujo.

Hay dos límites críticos:

**100 segundos para responder:** El Agent Flow debe ejecutar el Respond to agent dentro de 100 segundos desde que el agente lo invocó. Si lo supera, la llamada falla. Las acciones colocadas **después** del Respond to agent pueden continuar ejecutándose hasta 30 días — esto es el patrón correcto para tareas secundarias (logging, notificaciones, auditoría): devuelves la respuesta principal rápido y el flujo sigue ejecutando en background.

**Asynchronous response en Off:** En la acción Respond to agent, verifica que el toggle de **Asynchronous response** está desactivado. Si está en On, el agente no espera la respuesta del flujo y la llamada falla silenciosamente.

## Registrar el Agent Flow como tool del agente

Un Agent Flow publicado no está disponible para el agente automáticamente — hay que conectarlo:

**A nivel de agente** (recomendado): **Tools > Add a tool > Flow** > seleccionar el flujo > **Add and configure**. El orquestador generativo puede invocarlo en cualquier conversación cuando la descripción del tool encaja con la intención del usuario. La descripción es crítica:

```
Nombre: Clasificar y organizar documento
Descripción: Usa este flujo cuando el usuario pida clasificar, organizar o mover
un documento del data room. Requiere el nombre del archivo y el sitio de SharePoint.
Devuelve la categoría asignada y la ruta de destino.
NO usar para buscar documentos o consultar su contenido.
```

**A nivel de topic**: El flujo solo se invoca dentro de un topic específico. Útil cuando la automatización tiene sentido únicamente en un flujo conversacional concreto.

:::caution
**Desktop flows (RPA) no están soportados.** Si necesitas automatización de escritorio — interactuar con aplicaciones legacy sin API, scraping de interfaces de usuario, automatización de procesos en aplicaciones de escritorio — los Agent Flows no son el mecanismo. Necesitas Cloud Flows de Power Automate con desktop flows.
:::

## Express Mode: reducir latencia

Para flujos con mucha lógica pero poca transferencia de datos, **Express Mode** (preview) reduce la latencia de ejecución significativamente. Se activa en el trigger del flujo.

Límites con Express Mode activo:
- Máximo 100 acciones por ejecución (incluyendo iteraciones de bucles)
- 1024 caracteres por variable
- 64 KB por respuesta de conector
- 2 minutos de timeout total

No usar Express Mode si el flujo mueve grandes volúmenes de datos entre acciones.

## Capacidad consumida y monitorización

El consumo depende de cómo se invoca el flujo:

- **Desde un topic (Classic):** 1 Classic answer + acciones del flujo
- **Desde Generative Orchestration (Autonomous):** 1 Autonomous action + acciones del flujo
- **Pruebas en designer o test chat:** No consumen capacidad

Para monitorizar: **Power Platform Admin Center > Licensing > Copilot Studio > Agent flow actions**.

## Limitaciones que conviene conocer antes

Los Agent Flows no son compartibles. No puedes asignar co-owners, otorgar permisos run-only a otros usuarios ni copiarlos entre soluciones con la misma facilidad que los Cloud Flows. Si el flujo necesita ser mantenido por un equipo o compartido entre varios agentes con propietarios distintos, un Cloud Flow es más adecuado desde el principio.

La combinación "Run a prompt" dentro de un Agent Flow — IA especializada en mitad de un flujo determinista — es especialmente potente. El caso CS-006 la usa para clasificar documentos por nombre y metadatos sin salir del flujo: la clasificación es una tarea de razonamiento lingüístico (mejor con LLM) y el movimiento del archivo es una operación determinista (mejor con conector SharePoint). Un solo Agent Flow combina ambas.
