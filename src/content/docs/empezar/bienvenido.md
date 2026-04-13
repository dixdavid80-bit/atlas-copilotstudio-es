---
title: Bienvenido al Atlas
description: >
  Qué es este Atlas de Copilot Studio, para quién está escrito,
  cómo está organizado y cómo sacarle el máximo partido.
sidebar:
  order: 1
---

## Por qué existe este Atlas

La documentación oficial de Microsoft es extensa y está en inglés.
Los cursos que hay en el mercado oscilan entre lo superficial y lo
técnicamente denso. Ninguno de los dos extremos es útil para alguien
que necesita construir agentes reales en un entorno empresarial real,
sin un equipo de desarrolladores detrás.

Este Atlas nació para cubrir ese hueco.

No es una traducción de docs oficiales — es conocimiento destilado
con criterio propio, a partir de la **Agent Academy** de Microsoft,
la documentación técnica de arquitectura IQ, y la experiencia directa
construyendo agentes para entornos B2B.

Cuando digo "esto funciona" es porque lo he comprobado. Cuando digo
"esto no merece tu tiempo", lo digo con datos, no con intuición.

## Para quién está escrito

Este Atlas tiene tres perfiles de lector en mente:

**Perfiles de negocio** que necesitan entender qué puede hacer
Copilot Studio sin depender del equipo técnico para cada decisión.
No son developers, pero sí son responsables de decidir qué se
construye y con qué herramienta.

**Makers y citizen developers** que ya trabajan en Power Platform
y quieren añadir capacidades de agente a sus soluciones. Saben
moverse en entornos low-code y necesitan un mapa claro, no
tutoriales de cero.

**Formadores y consultores** que necesitan material estructurado
y con criterio para trasladar este conocimiento a equipos de clientes.
La voz editorial de este Atlas está pensada también para ser
referenciada en formaciones.

:::tip
Si no sabes en qué perfil encajas, empieza por la sección **Empezar**
de arriba abajo. En menos de una hora tendrás el contexto necesario
para decidir qué ruta seguir.
:::

## Qué NO encontrarás aquí

- Capturas de pantalla de cada botón — la interfaz cambia, el
  criterio no. Me centro en el "qué" y el "por qué", no en el
  "dónde está el menú".
- Tutoriales para principiantes absolutos de Microsoft 365. Asumo
  que sabes qué es Teams, SharePoint y OneDrive.
- Respuestas definitivas sobre precios — el modelo de licencias de
  Copilot Studio ha cambiado tres veces en doce meses. Doy contexto,
  pero para cifras exactas siempre remito a la fuente oficial.

## Cómo está organizado

El Atlas sigue el ciclo completo de trabajo con Copilot Studio:

1. **Empezar** — Entiende qué es, activa el entorno, crea tu primer
   agente. Esta sección es todo lo que necesitas si acabas de llegar.

2. **Construir** — Temas, nodos, entidades y Power FX. La mecánica
   real de cómo se estructura el comportamiento de un agente.

3. **Conectar** — Integración con Power Automate, Dataverse, APIs
   externas y MCP. Aquí es donde los agentes pasan de responder
   preguntas a ejecutar acciones reales.

4. **Publicar** — Canales de despliegue: Teams, web, Microsoft 365
   Copilot Chat. Configuración y consideraciones por canal.

5. **Escalar** — Gobernanza, ALM, analytics, licencias a escala
   y arquitectura multi-agente. Para cuando tienes más de un agente
   en producción.

:::tip
Cada sección puede leerse de forma independiente. Si tienes un agente
ya creado y solo necesitas publicarlo en Teams, ve directo a
**Publicar**. No hace falta leer todo en orden.
:::

## Convenciones del Atlas

A lo largo del Atlas encontrarás bloques especiales:

- Los bloques `:::tip` contienen recomendaciones personales basadas
  en uso real. Son lo que le diría a un colega, no lo que pone
  en el manual.

- Los bloques `:::caution` señalan trampas comunes, limitaciones
  no documentadas, o situaciones donde la documentación oficial
  es engañosamente optimista.

- Los fragmentos de código o instrucciones (como prompts de agente)
  están en bloques de código para que puedas copiarlos directamente.

- Cuando indico un precio o límite técnico concreto, incluyo la
  fecha de referencia. Este contenido tiene fecha de caducidad y
  lo reconozco.

## Una nota sobre el ritmo de cambio

Copilot Studio es un producto que Microsoft actualiza con frecuencia.
Entre 2024 y 2026, la plataforma pasó de llamarse Power Virtual Agents
a Copilot Studio, migró el modelo de precios de "mensajes" a
"Copilot Credits", e integró capacidades de agente autónomo que no
existían en la versión anterior.

Esto significa que parte de lo que leas en internet sobre Copilot
Studio está desactualizado, incluyendo vídeos con millones de
reproducciones. La fecha de publicación importa.

Este Atlas está escrito desde **abril de 2026** con las capacidades
actuales de la plataforma. Cuando algo cambie, lo actualizaré — pero
si tienes dudas sobre un punto concreto, contrasta con la
[documentación oficial de Microsoft](https://learn.microsoft.com/es-es/microsoft-copilot-studio/).

## Qué esperar de cada sección

**Empezar** es conceptual y práctica a partes iguales. Aquí
entiendes qué es Copilot Studio, dónde encaja en el ecosistema
Microsoft, cómo funciona el modelo de licencias (con datos reales,
no generalidades) y creas tu primer agente funcional. Si solo
lees esta sección, ya puedes tomar decisiones informadas sobre
si Copilot Studio es la herramienta adecuada para tu caso de uso.

**Construir** es donde está la mecánica real. Temas, nodos,
entidades, slots, Power FX básico. Aquí entiendes cómo se
estructura el comportamiento de un agente — qué hace cuando el
usuario dice X, cómo recoge datos, cómo gestiona casos que no
ha visto antes. Es la sección más técnica del Atlas.

**Conectar** es donde los agentes dejan de ser chatbots y se
convierten en herramientas de negocio. Power Automate para
automatización, Dataverse para persistencia de datos, APIs
externas para integraciones con sistemas de terceros, y MCP
(Model Context Protocol) para extensión avanzada. Si no conectas
el agente a datos y acciones reales, su utilidad es limitada.

**Publicar** es operacional: qué canal usar según el caso de uso,
cómo gestionar permisos, cómo testear en entorno real antes de
desplegar a toda la organización. También cubre las diferencias
entre publicar en Teams, en M365 Copilot Chat y en web externa.

**Escalar** es para cuando ya tienes agentes en producción y
necesitas pensar en gobernanza, control de versiones (ALM),
analítica de uso, diseño multi-agente y gestión de costes a
escala. No es para el primer agente — es para cuando el primero
funciona y quieres hacer diez más.

:::tip
Si eres nuevo en Copilot Studio, lee Empezar completo antes de
saltar a otra sección. No porque el orden sea obligatorio, sino
porque los conceptos de Empezar son la base para entender todo
lo demás. Veinte minutos aquí te ahorran horas de confusión
después.
:::
