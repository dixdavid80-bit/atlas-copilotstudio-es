---
title: Dataverse
description: Cuándo y cómo conectar tu agente con datos estructurados en Dataverse, y qué diferencia hay con ir directo desde Copilot Studio.
sidebar:
  order: 2
---

Dataverse es la base de datos relacional de Power Platform. A diferencia de SharePoint (listas de documentos con estructura flexible) o Blob Storage (archivos sin estructura), Dataverse ofrece tablas relacionales, tipos de datos nativos, lógica de negocio aplicada a nivel de plataforma, y control de acceso por fila. Es donde viven los datos críticos de negocio que el agente necesita consultar o actualizar en tiempo real.

El caso CS-004 (buscador de datos corporativos) ilustra el problema concreto: un usuario pregunta "¿hay laptops disponibles?" y el agente necesita consultar un registro que cambia constantemente. Las Knowledge Sources no sirven aquí — indexan contenido estático y devuelven datos obsoletos. El agente necesita ejecutar una query real en el momento exacto de la pregunta.

---

## Conexión directa vs. vía Power Automate

Hay dos formas de que el agente acceda a Dataverse, y la elección importa:

| Método | Cómo funciona | Limitaciones | Cuándo usar |
|--------|--------------|-------------|-------------|
| **Conexión directa (Knowledge Source)** | CS indexa las tablas de Dataverse y las incluye como fuente de conocimiento | Datos estáticos (el índice no se actualiza en tiempo real), sin filtrado dinámico, sin escritura | Consultas de lectura sobre datos que cambian poco (catálogos, configuraciones) |
| **Conector nativo en Topic** | Usar el conector de Dataverse directamente desde un nodo Tool del agente | Limitaciones de Power Fx para filtros complejos | Consultas simples con un criterio de filtro claro |
| **Vía Power Automate** | Un cloud flow ejecuta operaciones CRUD con lógica compleja | Requiere licencia PA; añade latencia | Operaciones de escritura, lógica multi-tabla, transformaciones |

:::tip
Para la mayoría de casos empresariales donde se consultan datos que cambian — inventario, tickets, solicitudes, asignaciones — la ruta correcta es el conector nativo desde un nodo Tool del agente, con un filtro OData dinámico construido con `Concatenate()` en Power Fx. Es más directo que montar un flow solo para leer datos.
:::

---

## Consultas en tiempo real con filtro OData dinámico

El patrón del CS-004 aplicado a Dataverse:

1. El usuario pregunta en lenguaje natural
2. El agente extrae el criterio de búsqueda en una variable (`Topic.VarCriterioBusqueda`)
3. Un nodo Tool ejecuta "List rows" del conector de Dataverse con filtro OData dinámico
4. El filtro se construye combinando condiciones fijas con la variable del usuario:

```
Concatenate(
  "statuscode eq 1 and new_tipo eq '",
  Topic.VarCriterioBusqueda,
  "'"
)
```

5. Los resultados se guardan en una variable global accesible para preguntas de seguimiento

El filtro OData admite los operadores estándar: `eq`, `ne`, `gt`, `lt`, `and`, `or`, `contains`. Para campos de texto con espacios, escapar con `'` dentro del Concatenate.

:::caution
El campo `statuscode` en Dataverse es numérico (1 = activo, 2 = inactivo), no un string "Active". Los filtros que usan el nombre del estado en lugar del código numérico fallan silenciosamente y devuelven cero resultados. Revisar el esquema de la tabla antes de configurar el filtro.
:::

---

## Operaciones de escritura: cuándo necesitas Power Automate

La lectura con el conector nativo es suficiente en muchos casos. La escritura es diferente. Cuando el agente necesita:

- Crear un registro nuevo en Dataverse a partir de datos del usuario
- Actualizar un campo específico de un registro existente
- Eliminar registros con validación previa
- Ejecutar lógica condicional sobre múltiples tablas antes de escribir

...entonces Power Automate es el camino. El flow recibe los datos del agente como inputs (Text/Number/Boolean), ejecuta las operaciones CRUD con el conector de Dataverse, y devuelve confirmación.

La ventaja de esta separación: el flow encapsula la lógica de escritura y puede reutilizarse desde múltiples agentes o temas sin duplicar código.

---

## Dataverse vs. SharePoint: cuándo usar cada uno

Esta es una pregunta que aparece siempre en implementaciones reales:

| Criterio | Dataverse | SharePoint |
|----------|-----------|------------|
| **Estructura de datos** | Relacional, con tipos nativos, FK entre tablas | Listas con columnas libres, sin FK real |
| **Volumen** | Millones de filas sin degradación | Empieza a ralentizarse sobre 5.000 items sin indexación manual |
| **Lógica de negocio** | Reglas, workflows y plugins aplicados en la plataforma | Solo mediante Power Automate externo |
| **Control de acceso** | Por fila, por columna, por rol de Power Platform | Por lista, con herencia de permisos de SharePoint |
| **Coste** | Incluido en planes Dynamics/Power Apps Premium | Incluido en M365 |
| **Integración con CS** | Conector nativo + Knowledge Source | Conector nativo + Knowledge Source |

Si los datos ya están en SharePoint y el volumen es manejable, no hay razón para migrar a Dataverse solo por conectar el agente. Si el sistema crece, requiere relaciones entre entidades o lógica de negocio aplicada en la plataforma, Dataverse es la decisión correcta a largo plazo.

---

## Buenas prácticas

- **Usar variables globales** para los resultados de Dataverse que el usuario pueda necesitar en preguntas de seguimiento. Una variable local a un Topic desaparece al terminar ese Topic.
- **Paginar los resultados**: el conector devuelve máximo 5.000 filas por defecto. Para conjuntos grandes, configurar Skip Token o múltiples llamadas paginadas desde el flow.
- **Confirmar antes de escribir**: si el agente va a crear o modificar un registro, mostrar un resumen al usuario y pedir confirmación explícita antes de invocar el flow de escritura.
- **Manejar el caso "sin resultados"**: una query que devuelve tabla vacía no es un error, pero el agente debe tratarlo con un mensaje útil, no silencio o JSON vacío.

:::caution
No uses Dataverse como fuente de conocimiento estática para datos que cambian. Un Knowledge Source indexa los datos en el momento de la configuración. Si el inventario se actualiza cada hora, el agente devolverá información desactualizada. Usa el conector nativo o Power Automate para datos en tiempo real.
:::

---

## Operaciones avanzadas: tablas relacionadas y lookups

Dataverse no es una lista plana. Las tablas están relacionadas mediante lookups (equivalente a foreign keys). Una solicitud puede estar vinculada a un contacto, que a su vez pertenece a una cuenta. Para navegar esas relaciones desde el agente hay dos opciones:

**Opción A — Expand en la query List rows:**
El conector de Dataverse soporta el parámetro `$expand` para incluir datos de tablas relacionadas en una sola llamada. Ejemplo: al listar solicitudes, expandir el lookup `_new_solicitante_value` para obtener el nombre del contacto sin una segunda llamada.

**Opción B — Múltiples llamadas encadenadas (vía Power Automate):**
Si el recorrido de relaciones es complejo (tres niveles de lookups, tablas de muchos a muchos), mejor ejecutarlo en un flow: la primera acción obtiene el registro principal, las siguientes recuperan los datos relacionados, y el flow devuelve al agente un objeto aplanado con todo lo que necesita para responder.

La Opción A reduce latencia; la Opción B ofrece más control y es más fácil de depurar.

---

## Escribir en Dataverse: el ciclo completo desde el agente

El flujo estándar para que un agente cree o actualice un registro en Dataverse:

```
1. El agente recoge datos del usuario mediante preguntas (Topic con variables)
2. Muestra un resumen al usuario y pide confirmación
3. El usuario confirma → el agente invoca el flow
4. El flow ejecuta "Add a new row" o "Update a row" en Dataverse
5. El flow devuelve el ID del registro creado/modificado
6. El agente confirma al usuario con el ID de referencia
```

El paso de confirmación (punto 2) no es cosmético: evita que un mal entendimiento de la pregunta del agente genere registros erróneos en producción. En escenarios de solicitudes, incidencias o aprobaciones, la confirmación explícita es parte del diseño, no un nice-to-have.

**Configuración del nodo "Add a new row":**

| Parámetro | Valor |
|-----------|-------|
| Table name | Nombre de la tabla en Dataverse |
| Campo de texto | Dynamic content de la variable del agente |
| Campo lookup | ID del registro relacionado (no el nombre) |
| Campo choice | Valor numérico del código de opción, no la etiqueta |

:::caution
Los campos de tipo Choice en Dataverse tienen un valor interno (número entero) y una etiqueta visible (texto). Al escribir mediante el conector, debes usar el valor numérico. Si usas la etiqueta "Pendiente" en vez del código 1 (por ejemplo), la acción falla con un error de tipo que puede ser difícil de diagnosticar.
:::

---

## Seguridad: acceso a nivel de fila

Una de las ventajas clave de Dataverse sobre SharePoint es el control de acceso a nivel de fila (Row-Level Security). Cada registro puede tener un propietario, y los roles de seguridad de Power Platform determinan qué usuarios pueden ver, editar o eliminar qué registros.

Esto es relevante para el agente en dos escenarios:

1. **El agente corre con la identidad del creador del flow (maker)**: ve todos los registros independientemente de los permisos del usuario que hace la pregunta. Correcto para datos internos sin clasificación; incorrecto para datos sensibles (expedientes de empleados, datos de clientes con restricciones contractuales).

2. **El agente corre con la identidad del usuario (user credentials)**: la query respeta los permisos del usuario que está interactuando. Requiere que el conector use "Current user" como credencial y que el usuario tenga licencia Power Apps/Dynamics para acceder a Dataverse directamente.

La elección entre ambos enfoques tiene implicaciones de licenciamiento y de gobernanza. En implementaciones enterprise, consultar con el administrador de Power Platform antes de decidir.

:::tip
Para datos de Dataverse que el agente debe filtrar por usuario (mostrar solo las solicitudes del usuario que pregunta, no todas), la opción más limpia es pasar el email del usuario como parámetro al flow e incluirlo en el filtro OData: `_new_solicitante_value eq '{{userEmail}}'`. Así el maker controla qué ve cada usuario sin necesitar credenciales delegadas ni licencias adicionales.
:::
