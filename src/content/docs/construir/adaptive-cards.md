---
title: Adaptive Cards para formularios interactivos
description: Cómo capturar datos estructurados con formularios visuales dentro de la conversación, incluyendo dropdowns dinámicos y validación en cliente.
sidebar:
  order: 4
---

Una conversación de texto secuencial — pregunta, respuesta, pregunta, respuesta — es un mecanismo pobre para capturar datos estructurados. Cuando un proceso de intake necesita seis campos con validación, el usuario abandona a la cuarta pregunta. Las **Adaptive Cards** resuelven esto: son formularios visuales interactivos que el agente envía dentro de la conversación, el usuario rellena de una vez, y el agente recibe como variables ya estructuradas.

El caso CS-003 ilustra el problema: procesos de intake que dependían de formularios en Word enviados por correo, con tasas de abandono del 30-40% y un 60% de formularios incompletos. La solución fue una Adaptive Card con seis campos (tipo de solicitud, empresa, presupuesto, timeline, descripción) presentada directamente en Teams. El intake pasó de 3-5 días de idas y vueltas por correo a 5 minutos de conversación.

## Schema version: la decisión más importante

Antes de diseñar nada, determina qué versión del schema Adaptive Cards puedes usar según tu canal de despliegue:

| Canal | Schema máximo | Notas |
|-------|--------------|-------|
| Teams (desktop y mobile) | **v1.5** | Teams no soporta v1.6 — punto sin vuelta atrás |
| Web Chat (Bot Framework) | v1.6 | Pero no soporta `Action.Execute` — solo `Action.Submit` |
| Dynamics 365 Omnichannel | v1.5 | Misma limitación que Teams |
| Test pane de Copilot Studio | v1.6 | Renderiza más que Teams — no es representativo |

:::caution
El test pane de Copilot Studio renderiza v1.6. Puedes diseñar algo que funcione perfectamente en el test y que falle en Teams porque usa features de v1.6. Siempre prueba en Teams si es tu canal principal. Diseña en v1.5 por defecto aunque el agente no sea inicialmente para Teams — es más fácil que migrar después.
:::

## Tipos de input disponibles

La paleta de elementos para capturar datos cubre la mayoría de necesidades de formulario:

| Elemento | Tipo JSON | Uso típico |
|----------|-----------|------------|
| Texto corto | `Input.Text` | Nombres, códigos, emails |
| Texto largo | `Input.Text` con `"isMultiline": true` | Descripciones, comentarios |
| Dropdown | `Input.ChoiceSet` con `"style": "compact"` | Listas de opciones (4+ items) |
| Radio buttons | `Input.ChoiceSet` con `"style": "expanded"` | Selección exclusiva con pocas opciones (2-3) |
| Selección múltiple | `Input.ChoiceSet` con `"isMultiSelect": true` | Categorías, tags |
| Fecha | `Input.Date` | Fechas de entrega, deadlines |
| Hora | `Input.Time` | Franjas horarias |
| Toggle | `Input.Toggle` | Confirmaciones sí/no, aceptar condiciones |

La recomendación sobre número de campos por card: máximo 6-8. Más de eso genera scroll excesivo en mobile y la tasa de completado cae drásticamente. Si el formulario necesita más campos, divide en pasos o prioriza los imprescindibles.

## Estructura básica de una card

Toda Adaptive Card interactiva necesita al menos un botón de tipo `Action.Submit`. Sin él, es solo una card de visualización — el usuario no puede responder.

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "Solicitud de acceso a sistema",
      "weight": "Bolder",
      "size": "Large",
      "wrap": true
    },
    {
      "type": "Input.Text",
      "id": "sistemaSolicitadoId",
      "label": "Sistema al que necesitas acceso",
      "placeholder": "Ej: CRM, ERP, Portal de RRHH...",
      "isRequired": true,
      "errorMessage": "Este campo es obligatorio"
    },
    {
      "type": "Input.ChoiceSet",
      "id": "nivelAccesoId",
      "label": "Nivel de acceso",
      "style": "compact",
      "isRequired": true,
      "choices": [
        { "title": "Solo lectura", "value": "lectura" },
        { "title": "Edición", "value": "edicion" },
        { "title": "Administración", "value": "admin" }
      ]
    },
    {
      "type": "Input.Text",
      "id": "justificacionId",
      "label": "Justificación del acceso",
      "isMultiline": true,
      "isRequired": true
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Enviar solicitud",
      "style": "positive"
    }
  ]
}
```

El `id` de cada campo se convierte en el nombre de la variable de output. `sistemaSolicitadoId` genera `Topic.sistemaSolicitadoId`. Elige nombres descriptivos desde el principio — cambiarlos después implica actualizar también los nodos que usan esas variables.

## Power Fx para cards dinámicas

El modo JSON crea cards completamente estáticas. El modo **Formula (Power Fx)** permite hacer las cards dinámicas: cargar opciones desde SharePoint, mostrar/ocultar secciones según el contexto, insertar valores calculados.

El caso CS-003 usa este patrón para el dropdown de tipo de proyecto: en lugar de opciones hardcodeadas, se cargan dinámicamente desde una lista de SharePoint con los servicios activos de la firma. Esto garantiza que el formulario siempre refleja el catálogo actual sin necesidad de editar la card cuando hay cambios:

```powerfx
{
  '$schema': "http://adaptivecards.io/schemas/adaptive-card.json",
  type: "AdaptiveCard",
  version: "1.5",
  body: [
    {
      type: "TextBlock",
      text: "Intake de solicitud",
      weight: "Bolder",
      size: "Large"
    },
    {
      type: "Input.ChoiceSet",
      id: "tipoProyectoId",
      label: "Tipo de proyecto",
      isRequired: true,
      style: "compact",
      choices: ForAll(
        Global.VarCatalogoServicios.value,
        {
          title: ThisRecord.Title,
          value: Text(ThisRecord.ID)
        }
      )
    }
  ],
  actions: [
    {
      type: "Action.Submit",
      title: "Enviar",
      style: "positive"
    }
  ]
}
```

`Global.VarCatalogoServicios` es una variable global que se pobló previamente con una acción Get Items al conector de SharePoint. Antes de mostrar la card, el agente hace la consulta y guarda los resultados en la variable global. Luego la card los usa para construir el dropdown en tiempo de ejecución.

:::caution
**Decisión irreversible:** Cuando cambias de JSON a Formula en las propiedades del nodo, no puedes volver al editor JSON. Copilot Studio convierte el JSON en Power Fx automáticamente, pero la conversión inversa no existe. Guarda siempre una copia del JSON original en tus notas antes de hacer el cambio. Microsoft lo recomienda explícitamente en su documentación.
:::

Otros usos de Power Fx en cards:

- **Visibilidad condicional:** `If(Topic.VarEsUrgente, "visible", "hidden")` en la propiedad `isVisible` de una sección
- **Texto dinámico:** `"Hola " & System.User.DisplayName & ", completa la siguiente información"`
- **Color condicional:** `If(Topic.VarPrioridad = "Alta", "attention", "default")` en el `style` de un TextBlock

## Cómo Copilot Studio recibe los datos del submit

Cuando el usuario pulsa el botón Submit, Copilot Studio captura automáticamente todos los campos en variables del topic. El `id` de cada campo se convierte en el nombre de la variable.

Si las variables generadas automáticamente no son correctas — tipos de dato incorrectos, nombres que no encajan con tu nomenclatura — puedes editarlas manualmente en el panel de propiedades del nodo: **Edit Schema**.

**Comportamiento ante respuestas inválidas:** Si el usuario envía un mensaje de texto en lugar de completar la card, se considera respuesta inválida. El agente reenvía la card hasta el número de veces configurado en "How many reprompts" (por defecto 2). Configura también el mensaje de reintento para que sea informativo, no genérico.

**Allow switching to another topic** está activado por defecto. Si el usuario envía un mensaje mientras espera que complete la card, puede interrumpir el flujo para ir a otro topic. Cuando el topic interrumpido termina, la card se reenvía. En la mayoría de casos esto es el comportamiento correcto, pero puede sorprender si no lo esperas.

## Validación: límites del lado cliente

Las Adaptive Cards soportan dos tipos de validación en el cliente (antes del submit):

- `isRequired: true` — bloquea el submit si el campo está vacío
- `regex` en `Input.Text` — valida formato (email, códigos, etc.)

Lo que **no** soportan: longitud mínima, dependencias entre campos, validaciones cruzadas. Para eso, añade nodos Condition después del submit en el topic con la lógica de validación y un redirect de vuelta a la card si algo falla.

:::tip
Añade un nodo Message antes de mostrar una card con datos dinámicos ("Cargando catálogo de servicios..."). La consulta a SharePoint puede tardar 2-5 segundos y el usuario puede interpretar el silencio como un error. Un mensaje de loading convierte esa espera en experiencia esperada.
:::

## Gotchas de producción

**Cards consecutivas pueden interferir entre sí.** Si el agente muestra varias Adaptive Cards en secuencia y el usuario pulsa Submit en una card anterior (que sigue visible en el historial), puede producir comportamiento inesperado. La solución es incluir identificadores únicos en el payload de cada Submit y añadir lógica de validación en el agente para ignorar submissions de cards que ya fueron procesadas.

**Sin persistencia automática.** Los datos capturados en la card existen solo como variables del topic. Si la conversación termina o el agente se reinicia, se pierden. Para persistir datos necesitas un Agent Flow que escriba en SharePoint, Dataverse u otro almacén. El caso CS-003 implementa esto: tras capturar el formulario, un Agent Flow crea el registro en la lista de solicitudes de SharePoint.

**Diseña fuera, pega dentro.** El diseñador integrado de Copilot Studio es funcional pero limitado para iteraciones rápidas. Para prototipar: diseña en [adaptivecards.io/designer](https://adaptivecards.io/designer/), copia el JSON, pégalo en Copilot Studio. También puedes generar el JSON inicial con IA (Claude, Copilot) describiendo los campos que necesitas y ajustando el resultado.

El Copilot Studio Kit incluye una **Adaptive Cards Gallery** con templates reutilizables — vale la pena revisarla antes de diseñar desde cero para formularios comunes.
