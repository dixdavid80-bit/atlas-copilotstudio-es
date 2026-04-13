---
title: Autenticación y SSO
description: Configurar SSO con Entra ID, variables de sistema y control de acceso por canal.
sidebar:
  order: 2
---

La autenticación en Copilot Studio no es un detalle técnico opcional. Define si tu agente sabe con quién está hablando, si puede acceder a datos del usuario, y si los documentos de SharePoint respetan los permisos. Sin autenticación, el agente trata a todos los usuarios de forma idéntica — y eso tiene consecuencias concretas: respuestas genéricas, exposición potencial de datos, y la imposibilidad de responder preguntas como "mis solicitudes pendientes" o "mis documentos".

## Las tres opciones de autenticación

| Opción | Descripción | Cuándo usarla |
|--------|------------|--------------|
| **No authentication** | Acceso anónimo, sin identidad de usuario | Agentes públicos de FAQ donde no importa quién pregunta |
| **Authenticate with Microsoft** | SSO con Microsoft Entra ID. El usuario no introduce credenciales si ya está en Teams/M365 | **Agentes internos para empleados** — el escenario más común en entornos corporativos |
| **Authenticate manually** | OAuth 2.0 con proveedor personalizado (Google, Salesforce, sistemas propios) | Agentes que necesitan autenticarse contra servicios externos no-Microsoft |

La configuración se encuentra en **Settings → Security → Authentication** dentro del agente.

## Authenticate with Microsoft — el escenario corporativo

Esta es la opción correcta para la mayoría de los agentes internos en organizaciones Microsoft 365. El flujo es completamente transparente para el usuario:

```
1. Usuario abre el agente en Teams (ya tiene sesión de Entra ID activa)
2. Teams tiene un token de sesión de Entra ID
3. Copilot Studio solicita un token delegado usando ese token
4. Entra ID emite un token con los claims del usuario (nombre, email, ID, roles)
5. Copilot Studio inyecta los claims en las variables System.User.*
6. El agente recibe esas variables sin que el usuario haya introducido credenciales
```

El resultado: el usuario abre el agente y ya está identificado. Sin pantallas de login. Sin introducir contraseñas. La sesión de Teams hace el trabajo.

:::tip
Esta opción no solo identifica al usuario — también hace que las knowledge sources de SharePoint hereden automáticamente sus permisos. Un usuario sin acceso a una biblioteca de SharePoint no verá esos documentos en las respuestas del agente, sin ninguna configuración adicional en Copilot Studio.
:::

## Variables de sistema del usuario

Cuando la autenticación está habilitada, Copilot Studio expone tres variables que puedes usar en cualquier parte del agente:

| Variable | Tipo | Contenido |
|----------|------|-----------|
| `System.User.DisplayName` | String | Nombre completo del usuario en Entra ID |
| `System.User.Email` | String | Correo electrónico principal |
| `System.User.Id` | String | Identificador único (GUID) del usuario en Entra ID |

**Dónde puedes usarlas:**
- En nodos **Send a message**: `"Hola, {System.User.DisplayName}. ¿En qué puedo ayudarte?"`
- En nodos **Condition**: `If System.User.Email EndsWith "@rrhh.empresa.com" Then...`
- En nodos **Set variable value**: para pasar la identidad a conectores o flujos de Power Automate
- En expresiones **Power Fx**: para lógica de personalización

**Ejemplo Power Fx — saludo seguro que maneja usuarios no autenticados:**

```
If(
    IsBlank(System.User.DisplayName),
    "Hola. Para una experiencia personalizada, necesitas iniciar sesión.",
    Concatenate("Hola, ", First(Split(System.User.DisplayName, " ")).Value, ". ¿En qué puedo ayudarte hoy?")
)
```

## Permisos de SharePoint — qué pasa automáticamente

Cuando configuras SharePoint como knowledge source y habilitas "Authenticate with Microsoft":

- **El agente hereda los permisos del usuario autenticado**: si el usuario no tiene acceso a una biblioteca o carpeta de SharePoint, el agente tampoco puede devolver documentos de ahí
- **No necesitas configurar reglas de acceso en Copilot Studio**: los permisos de SharePoint se aplican automáticamente
- **Excepción**: los documentos subidos directamente al agente (uploaded files) no tienen esta restricción — son accesibles para cualquier usuario con acceso al agente

Esto implementa dos de las cuatro capas de gobernanza recomendadas: identidad (Entra ID) y fuente (permisos de SharePoint).

:::caution
La herencia de permisos de SharePoint solo funciona cuando el agente está publicado en un canal que soporte SSO (Teams, M365 Copilot). En el canal web anónimo, no hay token de usuario y los permisos de SharePoint no se aplican. Si publicas en web y usas SharePoint como fuente, necesitas decidir si el acceso es completamente público o si implementas autenticación manual.
:::

## Conectores con identidad del usuario

Los conectores que el agente invoca como herramientas (tools) pueden usar la identidad del usuario autenticado para filtrar datos. Esto permite responder preguntas que antes eran imposibles:

| Conector | Capacidad con identidad |
|----------|------------------------|
| **SharePoint connector** | `Get items` filtrando por `Created By = System.User.Email` |
| **Dataverse connector** | Consultar registros asignados al usuario |
| **Microsoft Graph** | Perfil, manager, departamento, reuniones recientes, documentos frecuentes |
| **Planner / To Do** | Tareas asignadas al usuario |

Con esto, "mis documentos pendientes", "mis proyectos" o "mi equipo" dejan de ser aspiraciones y se convierten en consultas reales con datos reales del usuario autenticado.

## Autenticación manual — cuándo y cómo

Si necesitas autenticar contra un sistema externo (Salesforce, Google Workspace, un IdP propio), la opción "Authenticate manually" implementa OAuth 2.0 con el proveedor que configures. Requiere:

1. Un App Registration o equivalente en el proveedor externo
2. Configurar el Client ID, Client Secret y los endpoints de autorización en Copilot Studio
3. Definir los scopes necesarios para las operaciones que el agente realizará

En este modo, el usuario sí verá una pantalla de login — no hay SSO transparente salvo que el proveedor lo gestione por su cuenta.

## Configurar Entra ID — requisitos técnicos para SSO

Para que el SSO con Entra ID funcione correctamente fuera de Teams (por ejemplo, en un canal web con autenticación), necesitas:

1. **App Registration en Entra ID** con los scopes adecuados para tu caso de uso
2. **Redirect URI** configurada apuntando al endpoint de Copilot Studio
3. El agente publicado en un canal que soporte SSO
4. El usuario debe tener una licencia M365 activa con Entra ID

Para agentes desplegados solo en Teams, Copilot Studio gestiona el App Registration automáticamente cuando seleccionas "Authenticate with Microsoft". No necesitas crear nada manualmente.

:::tip
Si tu primer agente es para empleados internos en Teams, selecciona "Authenticate with Microsoft" y olvídate de la configuración técnica de Entra ID. Copilot Studio lo hace todo. Reserva la configuración manual para cuando necesites acceder a APIs externas con sus propios esquemas de autenticación.
:::

## Diferencias de autenticación por canal

No todos los canales soportan el mismo tipo de autenticación:

| Canal | SSO automático | Auth manual | Sin autenticación |
|-------|--------------|-------------|------------------|
| **Teams + M365 Copilot** | Sí | Sí | Sí |
| **Demo website** | No | No | Solo anónimo |
| **Sitio web personalizado** | No | Sí (OAuth 2.0) | Sí |
| **SharePoint** | Sí (hereda del sitio) | No | No |
| **Power Pages** | Depende de config del portal | Sí | Sí |
| **Facebook Messenger** | No | Sí (Facebook Auth) | No aplica |

La conclusión práctica: si necesitas que tu agente conozca al usuario, Teams es el canal que menos fricción genera. Para canales web con autenticación, la configuración es posible pero requiere trabajo adicional.
