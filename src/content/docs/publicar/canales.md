---
title: Canales de publicación
description: Dónde y cómo publicar tu agente — Teams, web, SharePoint y el resto de canales disponibles.
sidebar:
  order: 1
---

Publicar un agente en Copilot Studio tiene dos pasos que mucha gente confunde: el botón **Publish** y la configuración de **Channels**. Son cosas distintas. El primero empaqueta la versión actual del agente y la hace activa. El segundo define dónde los usuarios pueden encontrarlo. Sin ambos, el agente existe pero nadie puede usarlo.

:::caution
Los entornos de prueba (trial) no permiten publicar. Si el botón Publish aparece deshabilitado o da error, el problema es el entorno, no el agente. Necesitas un entorno de pago para llevar un agente a producción.
:::

## El proceso de publicación

Cada vez que modificas topics, knowledge sources, system prompt o acciones, los cambios no llegan a los usuarios hasta que pulsas Publish. No hay sincronización automática. Los usuarios que ya tienen el agente instalado reciben la actualización sin reinstalar nada — el próximo mensaje que envíen ya interactuará con la nueva versión.

**Cuándo republicar:**
- Después de cualquier cambio en topics o el system prompt
- Después de añadir o modificar knowledge sources o herramientas
- Después de modificar configuraciones de seguridad o autenticación
- **No hace falta** republicar para cambios en el icono o las descripciones del agente en Teams — esos se actualizan directamente desde la configuración del canal

:::tip
Antes de publicar, haz la verificación mínima en el Test pane: al menos 3 conversaciones representativas de los casos de uso principales. Un agente en producción con un comportamiento inesperado daña la adopción más que cualquier retraso en el despliegue.
:::

## Canales disponibles

Copilot Studio soporta ocho canales de despliegue. Cada uno tiene sus requisitos de configuración y sus características de experiencia:

| Canal | Configuración | Autenticación | Caso de uso típico |
|-------|--------------|--------------|-------------------|
| **Microsoft Teams + M365 Copilot** | Agregar canal → configurar disponibilidad | Entra ID (SSO) | Empleados internos — el canal principal |
| **Demo website** | Activar y copiar URL | Ninguna (anónimo) | Demos a stakeholders, pruebas de aceptación |
| **Sitio web personalizado** | Copiar snippet HTML → pegar en el sitio | Configurable | Portal de clientes, soporte en web corporativa |
| **Mobile app** | Configurar Direct Line API | Configurable | Apps corporativas o de campo |
| **SharePoint** | Agregar canal + especificar URL del sitio | Entra ID (heredada) | Intranets, wikis, portales internos |
| **Facebook Messenger** | Conectar página FB + autorizar permisos | Facebook Auth | Atención al cliente externa |
| **Power Pages** | Configurar portal + agregar componente | Portal auth | Portales de autoservicio, proveedores |
| **Azure Bot Service** | Registrar bot en Azure + configurar canales | Según canal | Slack, Telegram, Twilio SMS, LINE |

## Teams — el canal de referencia

Para agentes internos en organizaciones Microsoft 365, Teams es el punto de partida natural. Los usuarios ya están ahí y el agente aparece como una aplicación más en el chat. No necesitan salir de su entorno habitual.

### Cómo añadir el canal

1. Con el agente publicado, navega a **Channels** en la barra superior
2. Selecciona **Microsoft Teams + M365 Copilot**
3. Copilot Studio configura el canal automáticamente — espera a que el estado cambie a "Connected"
4. Haz clic en **See agent in Teams** para verificar la instalación en tu propio usuario

### Configurar la identidad del agente en Teams

Antes de hacer el agente visible para más personas, configura su identidad desde **Edit details**:

| Campo | Recomendación |
|-------|--------------|
| **Icono** | PNG 192×192 px con fondo transparente |
| **Short description** | Máximo ~80 caracteres — es lo que aparece en el catálogo de apps |
| **Long description** | Descripción completa de capacidades y limitaciones |
| **Developer name** | Nombre del equipo o departamento propietario |
| **Allow in group chats** | Activar si quieres que el agente participe en chats grupales |
| **Allow in meeting chats** | Activar si quieres que esté disponible durante reuniones |

### Niveles de disponibilidad

Cuando añades el canal de Teams, tienes cuatro opciones de alcance:

| Nivel | Descripción | Requiere admin |
|-------|------------|---------------|
| **Share link** | URL directa — solo quien tenga el enlace puede instalarlo | No |
| **Show to teammates** | Visible para compañeros del maker en el catálogo de apps | No |
| **Show to everyone** | Disponible para toda la organización | Sí (aprobación en Teams Admin Center) |
| **Download as .zip** | Descarga el manifiesto para despliegue manual o sideloading | No |

### El proceso de aprobación organizacional

Llevar un agente a toda la organización requiere que el administrador de Teams lo apruebe desde el **Teams Admin Center** (admin.teams.microsoft.com). El flujo es:

```
MAKER                                    ADMIN (Teams Admin Center)
─────                                    ─────────────────────────
Publish → Channels → Teams              Recibe la solicitud
→ "Show to everyone in my org"          Revisa: nombre, maker, permisos
→ Submit for admin approval    ──────▶  Aprueba y publica
                                        Agente aparece en "Built by your org"
                                        Opcional: auto-install + pin al left rail
```

:::tip
Contacta al administrador antes de enviar la solicitud. El proceso formal puede tardar horas o días si te presentas sin previo aviso. Una llamada de 10 minutos puede acelerar la aprobación considerablemente.
:::

Una vez aprobado, el administrador puede configurar la instalación automática para todos los usuarios y fijar el icono del agente en la barra lateral izquierda de Teams — lo que maximiza la visibilidad y la adopción sin que los usuarios tengan que buscar nada.

## Web — tres opciones con propósitos distintos

### Demo website

Copilot Studio genera automáticamente una URL temporal cuando activas este canal. No requiere configuración — activas el canal y copias la URL. Es anónima, cualquiera con el enlace puede acceder. Su función es demostrar, no producción.

Úsala para demos a patrocinadores del proyecto, pruebas de aceptación con usuarios que no tienen Teams, o para compartir el agente con personas externas a la organización durante el desarrollo.

### Sitio web personalizado

Genera un snippet de código HTML/JavaScript que puedes insertar en cualquier página. El widget de chat aparece en la esquina del sitio. Esta es la opción correcta para portales corporativos, landing pages de soporte o cualquier contexto donde quieras integrar el agente en tu web sin que el usuario tenga que salir de ella.

## Diferencias de experiencia por canal

La misma conversación puede verse (y comportarse) de forma diferente según el canal. Esto es crítico si tu agente usa Adaptive Cards o formato Markdown:

| Capacidad | Web (Demo/Custom) | Teams / M365 Copilot | Facebook Messenger |
|-----------|------------------|---------------------|------------------|
| Adaptive Cards | Sí (completo) | Sí (completo) | No |
| Markdown | Sí (completo) | Parcial (negritas, listas, links) | No |
| Mensaje de bienvenida | Sí | Sí | No |
| Inicio proactivo (auto-popup) | Sí (configurable) | No | No |
| Encuestas CSAT | Sí | Sí | Sí |
| Adjuntos de archivo | Sí | Sí | Sí |

:::caution
Si tu agente depende de Adaptive Cards para captura de datos o visualización de resultados, pruébalo en cada canal antes de desplegarlo. Lo que funciona perfectamente en Teams puede ser invisible en Facebook Messenger. El testeo en el canal real — no en el Test pane — es obligatorio antes de producción.
:::

## Developer Mode para depurar en producción

Una vez publicado en M365 Copilot, puedes activar el modo desarrollador escribiendo `-developer on` en el chat con el agente. Muestra información de depuración: qué knowledge sources se consultaron, qué topics se activaron, qué herramientas se invocaron. Solo es visible para quien lo activa — los usuarios normales no lo ven. Se desactiva con `-developer off`.

Es la herramienta correcta cuando un usuario reporta un comportamiento extraño y necesitas reproducirlo en el canal real sin afectar al resto.
