---
title: Power FX en Copilot Studio
description: Lógica avanzada para transformar datos, construir filtros dinámicos y controlar el flujo conversacional más allá de las condiciones visuales.
sidebar:
  order: 3
---

**Power Fx** es el lenguaje de fórmulas de Microsoft Power Platform — el mismo que encontrarás en Power Apps, Power Automate Desktop y ahora en Copilot Studio. Su presencia en el canvas conversacional cierra una brecha importante: permite hacer en el agente lo que antes requería un flujo de Power Automate externo para cualquier transformación de datos mínimamente compleja.

No es un lenguaje de programación completo. Es un lenguaje de fórmulas declarativo, similar en filosofía a Excel pero con capacidad para operar sobre tablas, registros, fechas y texto de forma expresiva. Para el perfil no-developer, la curva de aprendizaje es razonable si ya tienes experiencia con Excel. Para el developer, puede resultar frustrante al principio porque no es imperativo.

El caso CS-002 (router inteligente) demuestra su uso central: construir un filtro OData dinámico que combina el tipo de impuesto que eligió el usuario con la jurisdicción que especificó, y pasarlo directamente al conector de SharePoint para que la consulta devuelva solo los registros relevantes. Sin Power Fx, eso requeriría un flujo de Power Automate externo.

## Dónde se usa Power Fx en Copilot Studio

Power Fx aparece en tres lugares del canvas:

**Nodos Condition:** Para condiciones compuestas que el editor visual no puede expresar — comparaciones con OR/AND múltiples, funciones sobre strings, evaluación de valores nulos. El editor visual cubre el 80% de los casos; Power Fx cubre el resto.

**Nodos Set Variable:** Para transformar datos antes de usarlos — formatear fechas para mostrarlas al usuario, construir strings compuestos, contar filas de una tabla, extraer partes de un texto.

**Adaptive Cards en modo Formula:** Para hacer cards dinámicas — cargar opciones de un dropdown desde SharePoint, mostrar/ocultar secciones según el contexto, insertar valores calculados. Esto se cubre en detalle en el artículo de Adaptive Cards.

## Funciones esenciales por tipo de dato

### Texto

```powerfx
// Concatenar variables y literales
Concatenate("Solicitud de ", Topic.VarNombreUsuario, " — ref: ", Text(Topic.VarID))

// Normalizar mayúsculas para comparaciones
Upper(Topic.VarCategoria) = "IVA"

// Comprobar si contiene una subcadena
Find("urgente", Lower(Topic.VarMensaje)) > 0

// Reemplazar texto
Substitute(Topic.VarCodigo, "-", "")

// Construir un filtro OData dinámico (patrón frecuente con SharePoint)
Concatenate(
  "TipoImpuesto eq '", Topic.VarTipoImpuesto,
  "' and Jurisdiccion eq '", Topic.VarJurisdiccion,
  "' and Activo eq 1"
)
```

### Fechas

```powerfx
// Formatear para mostrar al usuario
Text(Topic.VarFechaLimite, "dd 'de' mmmm 'de' yyyy")
// Resultado: "20 de abril de 2026"

// Calcular días hasta una fecha
DateDiff(Today(), Topic.VarFechaVencimiento, TimeUnit.Days)

// Añadir días a una fecha
DateAdd(Today(), 30, TimeUnit.Days)

// Extraer componentes
Year(Topic.VarFecha) & "/" & Text(Month(Topic.VarFecha), "00")
```

### Números

```powerfx
// Convertir texto a número (necesario cuando viene de conectores)
Value(Topic.VarCantidadTexto)

// Redondear
Round(Topic.VarMonto, 2)

// Condicional numérico
If(Topic.VarMonto > 10000, "Requiere aprobación", "Aprobación automática")
```

### Tablas y registros

```powerfx
// Contar filas de resultados
CountRows(Topic.VarResultados)

// Primer elemento de una tabla
First(Topic.VarResultados).Title

// Filtrar una tabla en memoria
Filter(Topic.VarServicios, Activo = true && Categoria = "Fiscal")

// Búsqueda de un registro específico
LookUp(Topic.VarEmpleados, Email = Topic.VarEmailSeleccionado).NombreCompleto

// Mensaje condicional según cantidad de resultados
If(
  CountRows(Topic.VarResultados) = 0,
  "No se encontraron registros para esa búsqueda.",
  Concatenate(
    "Se encontraron ",
    Text(CountRows(Topic.VarResultados)),
    " registros disponibles."
  )
)
```

## Condiciones compuestas

El nodo Condition en modo visual solo permite comparar una variable contra un valor. Para condiciones más ricas, cambias a formula:

```powerfx
// Activar una rama si el tipo es IVA o Retenciones
Topic.VarTipoImpuesto = "IVA" || Topic.VarTipoImpuesto = "Retenciones"

// Verificar que dos condiciones se cumplan simultáneamente
Topic.VarPrioridad = "Alta" && Topic.VarDepartamento = "TI"

// Comprobación de valor nulo o vacío
IsBlank(Topic.VarRespuesta) || Topic.VarRespuesta = ""

// Condición sobre número de resultados
CountRows(Topic.VarResultados) > 0 && Topic.VarFiltroActivo = true
```

:::tip
Para cambiar de editor visual a fórmula en un nodo Condition: tres puntos `...` del nodo > "Change to formula". Para volver al visual: "Reset node" — pero esto borra la fórmula actual. Decide antes de empezar cuál de los dos modos usarás.
:::

## El patrón de filtro OData dinámico

Este es el uso más frecuente de Power Fx en agentes de producción que consultan SharePoint o Dataverse. El objetivo es construir la cadena de filtro combinando valores estáticos con variables del topic en tiempo de ejecución.

Supón que el usuario ha seleccionado tipo de impuesto "IVA" y jurisdicción "España". El conector Get Items de SharePoint necesita un filter query como string. Power Fx lo construye:

```powerfx
Concatenate(
  "TipoImpuesto eq '", Topic.VarTipoImpuesto,
  "' and Jurisdiccion eq '", Topic.VarJurisdiccion,
  "' and Activo eq 1"
)
```

Resultado en tiempo de ejecución: `TipoImpuesto eq 'IVA' and Jurisdiccion eq 'España' and Activo eq 1`

Este string se pasa directamente al campo "Filter Query" del conector. SharePoint ejecuta la query OData y devuelve solo los registros que cumplen los tres criterios.

El caso CS-004 (buscador de datos en tiempo real) aplica exactamente este patrón para el inventario de activos: el usuario pregunta por "laptops disponibles", Power Fx construye `Status eq 'Available' and AssetType eq 'Laptop'`, y SharePoint devuelve los registros actualizados al momento de la consulta.

## ParseJSON: acceder a datos de APIs

Cuando un conector devuelve JSON como texto (algo frecuente con conectores HTTP personalizados), ParseJSON permite acceder a sus campos:

```powerfx
// Parsear respuesta JSON de una API
Set(VarDatos, ParseJSON(Topic.VarRespuestaAPI))

// Acceder a un campo específico
Text(VarDatos.nombre)

// Acceder a un array
ForAll(
  Table(VarDatos.items),
  { nombre: Text(ThisRecord.nombre), precio: Value(ThisRecord.precio) }
)
```

:::caution
Power Fx en Copilot Studio usa **formato de numeración US** obligatoriamente: punto como separador decimal y coma como separador de parámetros de función. Esto aplica aunque el agente esté configurado en español y aunque el usuario español use comas decimales. Si escribes `Round(Topic.VarMonto; 2)` con punto y coma (estilo europeo), el editor te dará error de sintaxis.
:::

## Prefijos de scope: la regla de oro

En cualquier fórmula Power Fx, las variables necesitan su prefijo de scope. Sin él, la fórmula falla en silencio o toma el valor incorrecto:

- `Topic.VarNombre` — variable del topic actual
- `Global.VarUsuario` — variable global accesible desde cualquier topic
- `System.User.DisplayName` — nombre del usuario autenticado (solo lectura)
- `System.Activity.ChannelId` — canal desde donde habla el usuario (msteams, webchat, etc.)
- `Environment.VarConfigURL` — variable de entorno compartida entre agentes

El uso de `System.User.DisplayName` merece atención especial. Permite personalizar respuestas con el nombre del usuario sin pedírselo — solo funciona si el agente tiene autenticación configurada. Sin autenticación, devuelve vacío.

## Cuándo Power Fx no es la respuesta

Power Fx en el canvas conversacional tiene límites claros. Para lógica que va más allá, el mecanismo correcto es un Agent Flow o un Power Automate cloud flow:

- **Llamadas HTTP a APIs externas** que no tienen conector disponible
- **Bucles complejos** sobre grandes conjuntos de datos
- **Operaciones de escritura** en múltiples sistemas encadenados
- **Lógica de aprobación** con múltiples participantes

La regla práctica: si la lógica cabe en una fórmula de una o dos líneas y opera sobre datos ya disponibles como variables, Power Fx. Si necesitas salir del agente para consultar o escribir en sistemas externos, Agent Flow.
