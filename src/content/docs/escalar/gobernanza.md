---
title: Gobernanza
description: DLP, control de creación, seguridad enterprise y aprobación de despliegues organizacionales.
sidebar:
  order: 2
---

La gobernanza de agentes en Copilot Studio tiene dos niveles que se suelen confundir: el nivel técnico (DLP, permisos, entornos) y el nivel de proceso (quién aprueba qué, con qué criterios). Los dos son necesarios. El técnico sin el de proceso produce seguridad nominal pero no real. El de proceso sin el técnico produce documentación que nadie cumple.

## El problema de la proliferación

En organizaciones con licencias de Copilot Studio, cualquier persona con acceso al portal puede crear un agente en cuestión de minutos. Eso es intencionado — la democratización es parte del valor. El riesgo es que sin gobierno activo acabas con:

- Docenas de agentes huérfanos sin propietario visible
- Agentes en producción que nadie mantiene ni actualiza
- Knowledge sources conectadas a datos que no deberían ser accesibles
- Makers que no saben que su agente sigue activo y respondiendo a usuarios

El objetivo de la gobernanza no es bloquear la creación. Es asegurar que lo que llega a producción tiene un propietario, un propósito claro y controles adecuados.

## DLP — Data Loss Prevention

Las políticas DLP controlan qué conectores puede usar cada agente en cada entorno. Se configuran desde el **centro de administración de Power Platform** y se aplican a nivel de entorno.

Los conectores se clasifican en tres grupos:

| Grupo | Descripción | Ejemplo de conectores |
|-------|------------|----------------------|
| **Business** | Aprobados para datos corporativos sensibles | SharePoint, Dataverse, Teams, Outlook |
| **Non-Business** | Para datos no sensibles o uso personal | Twitter, YouTube, RSS |
| **Blocked** | No se pueden usar en ningún caso | Conectores que representan riesgo inaceptable |

La regla operativa de DLP: un conector en **Business** y otro en **Non-Business** no pueden coexistir en el mismo agente. Esto previene que datos corporativos viajen a servicios externos no aprobados.

:::tip
La estrategia más práctica para entornos enterprise: entorno de desarrollo con DLP permisivo (para que los makers puedan explorar) y entorno de producción con DLP estricto (solo conectores aprobados). Así no matas la innovación pero controlas lo que llega a producción.
:::

## Control de creación de agentes

El administrador de Power Platform puede controlar quién puede crear agentes y en qué entornos desde el **Power Platform Admin Center** → **Environments** → **Settings**.

Las opciones clave:
- **Quién puede crear agentes**: restringir a usuarios o grupos específicos
- **En qué entornos**: prohibir la creación de agentes en el entorno de producción directamente
- **Roles de seguridad**: los roles de Environment Maker, System Customizer y System Administrator tienen permisos diferentes sobre soluciones y agentes

:::caution
Prohibir completamente la creación de agentes mata la adopción. La estrategia correcta es permitir experimentación en un entorno dedicado de desarrollo y controlar lo que pasa a producción. Si bloqueas desde el inicio, el proyecto de IA corporativo muere antes de empezar.
:::

## Aprobación de despliegues organizacionales

Cuando un maker quiere desplegar un agente para toda la organización en Teams, el proceso requiere aprobación explícita del administrador de Teams. Este flujo de aprobación es en sí mismo un control de gobernanza:

```
MAKER                                    ADMIN (Teams Admin Center)
─────                                    ─────────────────────────
Configura el agente                      Recibe solicitud pendiente
Publica la versión final                 Revisa: nombre, maker, descripción
Channels → "Show to everyone"            Verifica que cumple políticas de naming
Submit for admin approval     ──────▶   y permisos
                                         Aprueba (o rechaza con comentarios)
                                         Agente aparece en "Built by your org"
                                         Opcional: auto-install + pin en Teams
```

El administrador puede rechazar la solicitud con comentarios — por ejemplo, si falta descripción adecuada, el nombre no cumple convenciones corporativas, o los permisos solicitados son excesivos. El maker no puede saltarse esta aprobación.

:::tip
Documenta los criterios de aprobación antes de que lleguen las primeras solicitudes. ¿Qué información debe incluir la descripción? ¿Qué convención de nombres se usa? ¿Quién revisa? Si el admin recibe solicitudes sin criterios claros, el proceso se vuelve arbitrario.
:::

## Las cuatro capas de seguridad para datos

En entornos enterprise donde un agente maneja información confidencial de múltiples usuarios o departamentos, la seguridad opera en cuatro capas:

```
Cada query del usuario pasa por:
  1. Identidad → Entra ID (¿quién eres?)
  2. Fuente → Permisos del repositorio (¿a qué tienes acceso?)
  3. Rol → Base de conocimiento (¿Propietario, Contribuidor o Lector?)
  4. Documento → ACLs + etiquetas Purview/DLP
```

Las capas 1 y 2 las gestiona automáticamente Copilot Studio cuando configuras "Authenticate with Microsoft" y usas SharePoint como knowledge source. Las capas 3 y 4 requieren trabajo adicional con Purview y la configuración explícita de roles en las knowledge bases.

El resultado práctico: un consultor del cliente A no ve datos del cliente B aunque ambos estén en la misma base de conocimiento del agente — porque el filtro de identidad y permisos se aplica antes de que la respuesta se genere.

## Catálogo gobernado de agentes

Para organizaciones con múltiples agentes en producción, el catálogo es el instrumento de gobernanza más práctico. No tiene que ser una herramienta sofisticada — puede empezar como una lista en SharePoint o una tabla en Dataverse — pero debe registrar para cada agente:

| Campo | Propósito |
|-------|-----------|
| Nombre y propósito | Qué hace exactamente |
| Propietario actual | La persona responsable de su mantenimiento |
| Entornos donde está desplegado | Dev, test, producción |
| Canales activos | Teams, web, SharePoint... |
| Knowledge sources conectadas | Qué datos consulta |
| Clasificación de datos | Nivel de sensibilidad de la información que maneja |
| Fecha de última revisión | Para detectar agentes que nadie revisa |
| Estado | Activo, en mantenimiento, deprecado |

Sin un catálogo, la respuesta a "¿cuántos agentes tenemos en producción y quién los mantiene?" es, en la práctica, "no lo sabemos". Y eso es un riesgo de gobernanza inaceptable a medida que escala el número de agentes.

## Versionado y ciclo de vida del agente

Cada publicación en Copilot Studio crea un snapshot de la versión activa. Los usuarios que ya tienen instalado el agente reciben la actualización automáticamente en su próxima interacción.

Para un versionado más robusto compatible con el catálogo:
- Documenta cada publicación relevante (qué cambió y por qué)
- Usa soluciones de Power Platform con números de versión explícitos
- Considera el ciclo ADLC: plan → build → test → deploy → monitor → operate
- Define un plan de deprecación antes de que llegue el momento — incluyendo cuánto tiempo se mantienen los audit logs del agente retirado

:::caution
Los agentes no se retiran solos. Un agente "abandonado" sigue respondiendo a usuarios con información potencialmente desactualizada. La gobernanza incluye procesos de retirada activa: notificación a usuarios, redirección a sustitutos, y baja formal del catálogo.
:::

## Monitorización continua de la postura de seguridad

La gobernanza no termina en el despliegue. Los riesgos que requieren monitorización continua en agentes enterprise son:

- **Drift agentico**: el comportamiento del agente cambia con el tiempo aunque no hayas modificado nada — porque los modelos subyacentes se actualizan
- **Fuga de datos**: respuestas que incluyen información que el usuario no debería ver
- **Prompt injection**: usuarios que intentan manipular el comportamiento del agente con instrucciones en sus mensajes
- **Escalado de privilegios**: el agente actúa con más permisos de los necesarios

La detección de estos problemas requiere revisar los logs de conversación periódicamente y, en entornos de alta criticidad, implementar evaluación automatizada en CI/CD que verifique el comportamiento esperado ante intentos de manipulación.
