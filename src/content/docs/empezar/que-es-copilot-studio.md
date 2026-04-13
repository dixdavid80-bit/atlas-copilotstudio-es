---
title: Qué es Copilot Studio
description: >
  Qué es Microsoft Copilot Studio, qué puedes construir con él,
  dónde encaja en el ecosistema IQ de Microsoft y cómo funciona
  el modelo de licencias real.
sidebar:
  order: 2
---

## En una frase

Copilot Studio es la plataforma low-code de Microsoft para diseñar,
construir y desplegar agentes de IA — desde asistentes conversacionales
hasta agentes autónomos que ejecutan procesos sin intervención humana.

Es el punto de entrada más accesible al mundo de los agentes dentro
del ecosistema Microsoft. No requiere saber programar, pero tampoco
te limita si quieres ir más lejos con conectores, APIs o Power FX.

## Qué puedes hacer

### Agentes conversacionales

El caso más inmediato: un agente que responde preguntas de empleados
o clientes usando tus propios documentos como fuente. Conectas
SharePoint, OneDrive o un sitio web, y el agente recupera respuestas
fundamentadas en ese contenido, no en el modelo de lenguaje en general.

Esto se llama **RAG** (Retrieval-Augmented Generation): el agente
busca primero en tus fuentes y luego genera la respuesta con ese
contexto. El resultado es mucho más preciso y verificable que un
chatbot genérico.

### Automatización de procesos multi-paso

Cuando alguien envía una solicitud de vacaciones, el agente puede:
recoger los datos, verificar el saldo disponible en Dataverse, enviar
la solicitud al responsable por Teams, y confirmar la respuesta al
empleado. Todo desde una conversación.

Esto se hace conectando Copilot Studio con **Power Automate** para
los flujos de trabajo y con **Dataverse** o listas de SharePoint
para los datos.

### Agentes autónomos (sin interacción humana)

Más allá del chat, puedes construir agentes que se activan por
disparadores externos — un correo recibido, un evento en un sistema,
una fecha — y ejecutan una secuencia de acciones sin que nadie
los interpele. Planifican, actúan, observan el resultado y replanifican
si algo falla.

Este es el escenario de mayor valor y también el de mayor complejidad.
Requiere entender bien la orquestación y el modelo de créditos
(ver sección de licencias más abajo).

### Extensiones para Microsoft 365 Copilot

Si tu organización tiene licencias de **M365 Copilot Enterprise**
($30/usuario/mes), puedes publicar agentes personalizados dentro de
Microsoft 365 Copilot Chat para que los usuarios los encuentren
junto a los demás copilotos de Microsoft.

:::caution
Publicar un agente en M365 Copilot Chat requiere que los usuarios
tengan licencia de M365 Copilot. Sin ella, el agente puede existir
pero no puede desplegarse en ese canal. Esto sorprende a mucha gente
que construye primero y se entera de la restricción después.
:::

## Qué NO es Copilot Studio

**No es un chatbot genérico.** ChatGPT y Copilot Studio no son
competidores directos. ChatGPT es un modelo de propósito general.
Copilot Studio es una plataforma para construir agentes especializados
con lógica de negocio, fuentes de datos propias y acciones reales
sobre sistemas corporativos.

**No es Power Virtual Agents con otro nombre.** La plataforma
evolucionó radicalmente. PVA era un sistema de flujos conversacionales
basado en árboles de decisión. Copilot Studio añade orquestación
generativa, RAG nativo, soporte para agentes autónomos y selección
de modelos (GPT-4o, Claude, modelos personalizados). Son arquitecturas
distintas.

**No reemplaza un equipo de desarrollo para integraciones complejas.**
Cubre el 80% de los casos de uso sin código. Para el 20% restante
— integraciones con sistemas legacy, lógica de negocio muy específica,
o requisitos de seguridad avanzados — necesitas perfil técnico o
un developer que construya conectores personalizados.

## Dónde encaja en el ecosistema Microsoft IQ

Microsoft ha organizado sus capacidades de IA en tres capas bajo
la arquitectura **IQ**:

| Capa | Función | Relevancia para Copilot Studio |
|------|---------|-------------------------------|
| **Work IQ** | Contexto humano: correos, reuniones, documentos, Graph | Copilot Studio accede a este contexto cuando el usuario tiene M365 Copilot |
| **Fabric IQ** | Inteligencia sobre datos operativos y estructurados | Los agentes pueden conectar con Fabric para razonamiento sobre datos cuantitativos |
| **Foundry IQ** | RAG gobernado sobre documentación y conocimiento no estructurado | Base técnica del RAG en agentes de Copilot Studio con Azure AI Foundry |

Lo que esto significa en la práctica: un agente de Copilot Studio
no opera de forma aislada. Tiene acceso al grafo de conocimiento
de tu organización (Work IQ), puede razonar sobre datos operativos
(Fabric IQ) y fundamenta sus respuestas en documentos internos
con búsqueda híbrida semántica (Foundry IQ).

El valor real no está en "extraer datos de un PDF". Está en cruzar
contexto humano + datos operativos + conocimiento documental en
una sola respuesta.

:::tip
Para casos de uso empresariales serios, diseña el agente pensando
en qué capas IQ necesita cruzar. Un agente que solo toca una capa
es fácil de construir pero limitado en valor. Uno que cruza las
tres capas es donde está la diferenciación real.
:::

## Los cuatro bloques de cualquier agente

Todo agente en Copilot Studio se construye combinando cuatro
componentes:

### 1. Conocimiento (Knowledge)

Las fuentes de datos que el agente usa para responder: documentos
en SharePoint, sitios web, bases de datos, archivos PDF, listas
de Dataverse. Cuando un usuario hace una pregunta, el agente busca
en estas fuentes antes de generar una respuesta.

También incluye el contexto conversacional: el agente recuerda
lo dicho en la misma conversación para que el usuario no tenga que
repetirse.

### 2. Herramientas (Tools / Actions)

Lo que el agente puede hacer más allá de responder: enviar correos,
crear registros, llamar a APIs, ejecutar flujos de Power Automate,
actualizar listas de SharePoint. Sin herramientas, el agente solo
habla. Con herramientas, actúa.

### 3. Temas (Topics)

Los puntos de entrada conversacionales del agente. Cada tema
corresponde a una funcionalidad o categoría de preguntas. La
orquestación generativa de Copilot Studio interpreta la intención
del usuario y activa el tema correcto, sin que tengas que mapear
palabras clave exactas.

### 4. Instrucciones (Instructions)

El equivalente al **system prompt** del agente. Aquí defines quién
es el agente, qué tono tiene, qué reglas debe seguir, y qué no
debe hacer en ningún caso. Es lo que convierte un modelo genérico
en un agente con identidad y comportamiento específicos.

## Licencias: lo que necesitas saber antes de construir

El modelo de licencias de Copilot Studio tiene tres partes que
conviene entender antes de construir, no después.

### Copilot Credits: la moneda de uso

Desde 2025, Copilot Studio mide el uso en **Copilot Credits** —
no en "mensajes" como hacía antes. Cada vez que el agente busca
información, responde, ejecuta una acción o llama a un flujo,
consume créditos. Las acciones más complejas consumen más créditos
que las respuestas simples.

La única excepción: el chat de pruebas integrado en el editor
no consume créditos. Todo lo demás sí.

### Tres formas de adquirir créditos

**Pay-as-you-go (PAYGO):** Sin compromiso previo. Pagas 0,01 USD
por crédito consumido, facturado a través de Azure. Ideal para
desarrollo y cargas variables o impredecibles.

**Paquete de capacidad:** Suscripción mensual de 25.000 créditos
por 200 USD. Los paquetes se acumulan a nivel de tenant y puedes
comprar varios. Los créditos no utilizados no se acumulan al mes
siguiente. Indicado para producción con uso predecible.

**Plan prepago anual (CCCUs):** Compra anual de grandes volúmenes.
Cada Copilot Credit Commit Unit equivale a 100 créditos. Da ventaja
de coste a escala y presupuesto predecible para flotas de agentes.

### Licencias de usuario

Dos roles distintos con licencias distintas:

- **Makers (constructores):** Necesitan la **Copilot Studio User License**
  (0 USD) asignada por el administrador. Sin ella, no pueden crear
  ni gestionar agentes.

- **Usuarios finales:** Consumen créditos del tenant cuando interactúan
  con agentes. No necesitan licencia individual de Copilot Studio,
  pero sí necesitan M365 Copilot para acceder a agentes desplegados
  en ese canal.

### Lo que incluye M365 Copilot — y lo que no

Los usuarios con M365 Copilot Enterprise ($30/usuario/mes) pueden
crear e interactuar con agentes en Teams y M365 Copilot Chat con
interacciones básicas cubiertas por su licencia.

Pero en cuanto el agente hace algo más avanzado — ejecutar flujos,
usar conectores externos, publicar fuera de M365, disparar acciones
autónomas — eso consume créditos de Copilot Studio del tenant,
independientemente de la licencia individual del usuario.

:::caution
Regla práctica: interacción básica interna en M365 la cubre la
licencia de M365 Copilot. Todo lo que implique automatización,
integraciones o publicación externa consume créditos de Copilot
Studio. Si construyes un agente con Power Automate y lo publicas
en web, cada conversación consume créditos, siempre.
:::

### Tabla de escenarios reales

| Escenario | Licencia requerida | Créditos |
|-----------|-------------------|---------|
| Maker creando agentes | Copilot Studio User License (gratis) | No aplica |
| Agente en Teams respondiendo preguntas básicas | M365 Copilot del usuario | Mínimo o cubierto |
| Agente con Power Automate o conectores | Copilot Studio capacity | Sí, siempre |
| Agente autónomo (sin interacción humana) | Copilot Studio capacity | Sí, siempre |
| Agente publicado en web externa | Copilot Studio capacity | Sí, siempre |

### Cómo planificar el coste antes de lanzar

Usa el **Copilot Studio Usage Estimator** de Microsoft para
estimar créditos por agente y mes antes de ir a producción.
Monitoriza el consumo real en el Power Platform Admin Center
(Billing → License → Copilot Studio). Desactiva las herramientas
del agente que no uses — cada herramienta activa puede consumir
créditos aunque no se llame.

:::tip
Empieza con PAYGO durante el desarrollo. Cuando tengas datos reales
de consumo, cambia a paquetes de capacidad si el uso es predecible.
Mezclar ambos (paquete + PAYGO como overflow) es la estrategia más
robusta para producción: evita interrupciones si el paquete se agota.
:::
