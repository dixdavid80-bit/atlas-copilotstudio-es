---
title: ALM — Ciclo de vida y despliegue
description: Soluciones, entornos, pipelines y desarrollo code-first con VS Code y PAC CLI.
sidebar:
  order: 1
---

ALM (Application Lifecycle Management) en Copilot Studio no es solo mover un agente de desarrollo a producción. Es la disciplina que determina si un agente es sostenible a largo plazo: versionado controlado, despliegues sin sorpresas, posibilidad de revertir cambios, y colaboración entre makers. Sin ALM, cada agente es un proyecto artesanal que depende de la persona que lo construyó.

## El problema por defecto

Cuando creas un agente en Copilot Studio sin pensar en ALM, el agente aterriza en la **Default solution** del entorno donde trabajas. Eso significa:

- No puedes exportarlo limpiamente a otro entorno
- Todas sus dependencias (flujos, variables de entorno, conexiones) están mezcladas con el resto del entorno
- Si algo se rompe en producción, no hay forma de revertir a una versión anterior
- No hay trazabilidad de qué cambió y cuándo

La solución es sencilla pero hay que hacerlo desde el primer día.

## Soluciones — el contenedor de todo

Una solución de Power Platform es el "contenedor" que agrupa todos los componentes de tu agente: el agente en sí, sus temas, sus flujos de Power Automate, variables de entorno, referencias de conexión. Todo lo que el agente necesita viaja dentro de la solución.

Hay dos tipos:
- **Unmanaged**: para desarrollo. Se puede editar libremente.
- **Managed**: para pruebas y producción. Está bloqueada para prevenir ediciones accidentales.

El flujo correcto es: desarrollas en unmanaged, exportas como managed, e importas esa versión managed en los entornos de destino.

### Crear una solución y un publisher

El publisher es la "marca" que identifica quién creó la solución. Define un prefijo que se añade a todos los componentes (por ejemplo, `cts_` para Contoso Solutions). Sirve para identificar qué pertenece a qué solución y evitar conflictos de nombres entre equipos.

En Copilot Studio, navega a los tres puntos del menú lateral → **Solutions** → **New solution**. Antes de crear la solución necesitas un publisher. Si no existe uno para tu organización o equipo, créalo en el mismo flujo con un nombre descriptivo y un prefijo corto y único.

:::tip
Marca la casilla "Set as your preferred solution" al crear la solución. Así todos los agentes que crees después quedarán automáticamente dentro de ella sin tener que recordarlo cada vez.
:::

## Entornos — la estrategia mínima

Para cualquier agente en producción real, la configuración mínima es tres entornos:

| Entorno | Tipo de solución | Propósito |
|---------|-----------------|-----------|
| **Desarrollo** | Unmanaged | Construir, experimentar, romper cosas sin consecuencias |
| **Test / UAT** | Managed | Validar antes de producción con usuarios reales |
| **Producción** | Managed | El agente que usan todos los usuarios finales |

El flujo de trabajo estándar:

```
DEV (unmanaged)
  → Exportar como Managed solution
  → Importar en TEST
  → Validar (UAT, pruebas de integración)
  → Importar la misma versión Managed en PROD
```

Nunca edites directamente en producción. Nunca importes una solución en prod sin haberla validado en test.

## Pipelines — automatizar el despliegue

Power Platform Pipelines permite automatizar el proceso de exportación e importación entre entornos. En lugar de hacerlo manualmente cada vez, configuras un pipeline que mueve la solución de dev a test a prod con los controles necesarios (aprobaciones, gates de calidad).

Los pipelines se configuran desde el centro de administración de Power Platform y pueden integrarse con Azure DevOps o GitHub Actions para organizaciones que ya tienen CI/CD establecido.

:::caution
Los Pipelines de Power Platform evolucionan rápido. La funcionalidad disponible cambia cada trimestre. Lo que describes en este atlas puede quedar desactualizado antes de que lo leas. Verifica el estado actual en la documentación oficial antes de diseñar tu estrategia de despliegue.
:::

## Desarrollo code-first — VS Code + PAC CLI

Microsoft ha construido un ecosistema de herramientas que permite trabajar con agentes de Copilot Studio como **código versionable** en lugar de exclusivamente a través del portal web. Esto abre posibilidades que el portal no tiene: edición con IA, Git, PRs, revisiones de código, plantillas reutilizables.

### Las herramientas disponibles (estado 2026)

| Herramienta | Estado | Qué hace |
|-------------|--------|----------|
| **VS Code Extension** | GA (enero 2026) | Clonar/editar/sincronizar agentes como YAML |
| **PAC CLI `pac copilot`** | GA | Crear, publicar, listar, extraer templates |
| **PAC CLI MCP Server** | GA | Registrar Power Platform como MCP en Claude Code |
| **skills-for-copilot-studio** | Experimental | 4 skills para Claude Code (manage, author, test, troubleshoot) |

### Cuándo usar code-first

Code-first tiene sentido en estos contextos:

- Agentes complejos con múltiples topics, herramientas y knowledge sources (5+ componentes)
- **Templating**: crear variantes de un agente base para diferentes departamentos o jurisdicciones
- **Colaboración**: varios makers trabajando en el mismo agente usando Git y pull requests
- **ALM enterprise**: pipelines dev → test → prod con control de versiones real
- Quieres que Claude Code (u otra IA) genere o edite topics, expresiones Power Fx o configuraciones

No tiene sentido para agentes simples de 1-2 topics, prototipos rápidos, o el primer agente de un proyecto (siempre hay que crearlo primero en el portal).

### Setup: VS Code Extension + PAC CLI

**Instalar la extensión de VS Code:**

1. Extensions (Ctrl+Shift+X) → buscar "Microsoft Copilot Studio" (publisher: ms-CopilotStudio)
2. Instalar y autenticarse con la cuenta Microsoft que tiene acceso a Copilot Studio
3. En el panel lateral aparecen tus entornos y agentes

**Instalar PAC CLI:**

```bash
# Requiere .NET 10 o superior
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Verificar instalación
pac --version

# Autenticarse con el entorno
pac auth create --environment https://tuorg.crm.dynamics.com

# Listar agentes del entorno
pac copilot list
```

**Clonar un agente para editarlo localmente:**

En el panel de VS Code, clic derecho sobre el agente → **Clone Agent** → seleccionar carpeta destino. La estructura resultante:

```
mi-agente/
├── topics/          ← Flujos conversacionales (YAML)
├── actions/         ← Tools: prompts, conectores, APIs
├── knowledge/       ← Knowledge sources
├── workflows/       ← Power Automate flows (JSON)
├── triggers/        ← Event triggers
├── agent.mcs.yaml   ← Config principal (instructions, modelo)
├── settings.mcs.yml ← Configuración del agente
└── connectionreferences.mcs.yml
```

### El workflow con Claude Code

```
1. CREAR el agente en el portal web (obligatorio la primera vez)
2. PUBLICAR el agente
3. CLONAR a local con la extensión VS Code
4. EDITAR los archivos YAML/JSON con Claude Code:
   - Topics (condiciones, variables, Power Fx)
   - Prompt Tools (instrucciones, inputs)
   - agent.mcs.yaml (system prompt)
5. APPLY desde VS Code → sube cambios al agente en cloud
6. PROBAR en el Test pane del portal
7. PUBLICAR: pac copilot publish --bot <ID>
8. COMMIT a Git → historial de cambios versionado
```

Microsoft menciona explícitamente a Claude Code como herramienta compatible: *"Use Visual Studio Code with GitHub Copilot, Claude Code, or your favorite agent to create and update Copilot Studio agent definition components."*

### Registrar el MCP Server de PAC CLI (opcional)

Si quieres controlar Power Platform directamente desde Claude Code via lenguaje natural:

```bash
claude mcp add-json pac-cli '{"type":"stdio","command":"dnx","args":["Microsoft.PowerApps.CLI.Tool","--yes","copilot","mcp","--run"]}'
```

Tras registrarlo, puedes pedir a Claude Code que liste agentes, publique versiones o extraiga templates sin salir del contexto de trabajo.

:::caution
El plugin experimental `skills-for-copilot-studio` añade 4 skills (manage, author, test, troubleshoot), pero Microsoft advierte: "you might sometimes experience unwanted patterns, errors, or simply bad architectures." Úsalo para explorar, no en pipelines de producción.
:::

## El ciclo de vida completo

El modelo maduro de ALM para agentes de Copilot Studio sigue el ADLC (Agent Development Lifecycle), que adapta DevSecOps a la naturaleza probabilística de los agentes de IA:

1. **Plan**: definir KPIs, riesgo aceptable y criterios de éxito antes de construir
2. **Build**: prompts versionados como código, herramientas gobernadas, observabilidad desde el inicio
3. **Test**: evaluación automatizada — no solo "funciona", sino "funciona correctamente con datos reales"
4. **Deploy**: feature flags, canary deployments, kill-switch obligatorio
5. **Monitor**: métricas de calidad, seguridad y negocio en tiempo real
6. **Operate**: catálogo gobernado de agentes certificados, audit logs, plan de deprecación

La diferencia con el SDLC clásico es que en agentes la pregunta no es "¿está arriba?" sino "¿está respondiendo bien?". Eso requiere evaluación continua, no solo monitorización de disponibilidad.
