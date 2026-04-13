---
title: APIs externas
description: Conectores custom y llamadas HTTP para integrar cualquier servicio externo con tu agente.
sidebar:
  order: 4
---

Copilot Studio no llama APIs directamente — necesita un intermediario. Esto no es una limitación técnica arbitraria: es una decisión de diseño que centraliza la autenticación, el manejo de errores y la reutilización en la capa de Power Platform, donde se pueden gobernar y auditar.

Las tres opciones principales, ordenadas de menor a mayor complejidad:

---

## Nodo HTTP Request en Copilot Studio

Desde Copilot Studio puedes hacer llamadas HTTP directamente desde un Topic, sin pasar por Power Automate. El nodo HTTP Request es la opción más ligera para integraciones simples.

Cuándo usarlo:
- Una sola llamada a una API REST con respuesta JSON simple
- No necesitas lógica condicional basada en la respuesta antes de continuar
- Quieres menos latencia que un flow completo de Power Automate

Cuándo NO es suficiente:
- La API requiere múltiples llamadas encadenadas
- Necesitas parsear y transformar la respuesta antes de usarla
- La lógica de error es compleja (reintentos, fallbacks, notificaciones)
- La misma llamada la reutilizan múltiples agentes o topics

:::tip
Si solo necesitas hacer una llamada HTTP simple a una API, el nodo HTTP Request en Copilot Studio es más ligero y rápido que montar un cloud flow completo de Power Automate. Menos overhead, sin licencia adicional, menos latencia.
:::

---

## Power Automate + Acción HTTP

La opción más común para integraciones con APIs externas. El cloud flow encapsula la llamada HTTP, gestiona la autenticación, transforma la respuesta, y devuelve al agente solo los datos que necesita.

**Ventajas frente al nodo HTTP directo:**
- Reintentos automáticos configurables (Fixed: 2 reintentos, intervalo 10 seg)
- Parseo y transformación de respuestas complejas con expresiones
- Gestión de autenticación centralizada (variable de entorno, Key Vault)
- Reutilizable desde múltiples agentes sin duplicar lógica
- Historial de ejecuciones en Power Automate para debugging

**Configuración mínima de la acción HTTP:**

| Parámetro | Descripción |
|-----------|-------------|
| Method | GET, POST, PUT, PATCH, DELETE |
| URI | URL del endpoint (usar variable de entorno, no hardcode) |
| Headers | Content-Type, Authorization |
| Body | JSON con los parámetros de la llamada |

La respuesta llega como texto JSON. Parsear con la acción "Parse JSON" usando un schema generado desde un payload de ejemplo.

---

## Conectores custom

Un conector custom es una definición reutilizable de una API para toda la organización. Se configura una vez en Power Platform y está disponible para todos los flows y aplicaciones del entorno.

Cuándo invertir en un conector custom:
- La misma API la consumen tres o más flows o agentes
- La API tiene autenticación compleja (OAuth 2.0 con refresh tokens)
- Quieres que otros equipos puedan usar la integración sin entender la API

Cuándo no vale la pena:
- La API la usa un solo flow y es poco probable que escale
- La API es interna y cambia frecuentemente — mantener el conector se vuelve costoso

**Proceso básico:**
1. Si la API tiene especificación OpenAPI (Swagger), importarla directamente en Power Platform → Custom Connectors → New → Import from OpenAPI file
2. Si no tiene especificación, crear el conector manualmente definiendo cada operación (endpoint, método, parámetros, esquema de respuesta)
3. Configurar la autenticación: API Key, OAuth 2.0 o Managed Identity
4. Probar el conector con la herramienta de testing integrada
5. Compartir con el entorno para que esté disponible en todos los flows

---

## Patrones de autenticación

| Patrón | Cuándo usar | Configuración |
|--------|-------------|---------------|
| **API Key** | APIs de terceros con autenticación simple (Bing, servicios SaaS) | Header `Authorization: Bearer {{api_key}}` desde variable de entorno |
| **OAuth 2.0** | APIs que requieren autenticación delegada (en nombre del usuario) | Configurar en el conector custom con client_id y client_secret |
| **Managed Identity** | Servicios dentro de Azure (Key Vault, AI Search, Blob Storage) | Sin credenciales explícitas — Azure gestiona la identidad |
| **Basic Auth** | APIs legacy con usuario/contraseña | Header `Authorization: Basic {{base64(user:pass)}}` — evitar si hay alternativa |

:::caution
Nunca almacenes credenciales (API keys, tokens, contraseñas) en variables del agente, en el propio flow hardcodeadas, ni en columnas de SharePoint visibles. El lugar correcto es Azure Key Vault para entornos enterprise, o como mínimo Variables de Entorno de Power Platform (que cifran los valores). Un flow mal configurado que expone una API key en los logs de ejecución es un incidente de seguridad.
:::

---

## Manejo de errores en integraciones con APIs externas

Las APIs externas fallan. No es cuestión de si, sino de cuándo. Un agente bien construido anticipa los fallos y los gestiona con gracia.

**Configuración de reintentos en Power Automate:**
- En la acción HTTP → Settings → Retry Policy → **Fixed**
- Count: 2 reintentos
- Interval: PT10S (10 segundos)
- Cubre errores transitorios (503, 429 por throttling, timeouts de red)

**Timeout por acción:**
- Configurar timeout de 30 segundos en llamadas HTTP — deja margen para el límite global de 100 segundos del agente
- Si la API tarda más de 30 segundos de forma habitual, rediseñar la integración (llamada asíncrona, webhook de callback)

**Respuesta de error al agente:**
El flow debe devolver siempre algo al agente, incluso si la llamada falla. En la acción "Respond to the agent", mapear un output `error_message` que el agente puede usar para informar al usuario con un mensaje útil ("El sistema de inventario no está disponible en este momento, intenta de nuevo en unos minutos"), no un JSON de error crudo.

```
Condition: ¿La llamada HTTP fue exitosa?
  ├── Sí → Respond to agent: {datos procesados, error_message: ""}
  └── No → Respond to agent: {datos: "", error_message: "Servicio no disponible: {{statusCode}}"}
```

:::tip
Testea el flow de forma independiente antes de conectarlo al agente. Power Automate permite ejecutar un flow manualmente desde el editor con datos de prueba. Un flow que funciona de forma aislada es fácil de depurar; un flow que falla solo cuando lo invoca el agente es frustrante de diagnosticar.
:::

---

## Cuándo usar Azure Functions

Para lógica que no cabe en Power Automate:
- Procesamiento de archivos binarios (parseo de PDFs, transformación de imágenes)
- Lógica de negocio compleja con múltiples condiciones encadenadas que en PA resultaría en 50+ acciones
- Integración con librerías de código que no tienen conector en Power Platform
- Latencia muy baja requerida (Functions escala a cero y responde en milisegundos)

La integración sigue el mismo patrón: Power Automate llama a la Azure Function via HTTP, la Function ejecuta la lógica, devuelve JSON, el flow parsea y pasa al agente. El agente nunca sabe que hay una Function detrás — solo ve el resultado del flow.

---

## Diseñar la interfaz del flow como si fuera una API

El error más frecuente en integraciones es tratar el flow como una extensión del agente, no como un servicio independiente. Un flow bien diseñado tiene:

- **Entrada clara**: inputs con nombres descriptivos, tipos correctos (Text/Number/Boolean), sin lógica de extracción dentro del flow — eso es trabajo del agente
- **Salida clara**: outputs con nombres que el agente puede usar directamente en el mensaje al usuario; no devolver JSON crudo que el agente luego tiene que parsear en la conversación
- **Sin side effects inesperados**: si el flow envía un email, el agente debe saberlo — el usuario no debería recibir una notificación sin haberla solicitado explícitamente
- **Idempotente cuando sea posible**: si el flow se invoca dos veces con los mismos inputs (reintento por timeout), el resultado debería ser el mismo sin duplicar registros ni enviar dos emails

Esta separación permite reutilizar el mismo flow desde múltiples topics o agentes sin cambiar su lógica interna. Un flow que consulta el estado de una solicitud en ServiceNow puede usarlo el agente de soporte IT, el agente de RRHH y el agente de operaciones, todos con la misma implementación.

---

## Variables de entorno en lugar de valores hardcodeados

Las URLs de endpoints, los nombres de recursos de Azure, los IDs de listas de SharePoint y cualquier valor que pueda cambiar entre entornos (desarrollo, preproducción, producción) deben configurarse como **Variables de Entorno de Power Platform**, no hardcodeados en el flow.

**Por qué importa en la práctica:**
- Un flow que tiene `https://api.empresa.com/prod/` hardcodeado no se puede promover a otro entorno sin modificar el flow
- Un flow con una variable de entorno `ENV_API_BASE_URL` se promueve intacto — solo se cambia el valor de la variable en el entorno destino
- Las Variables de Entorno de tipo `Secret` cifran el valor en reposo — más seguro que texto plano en el flow

**Cómo usarlas en el flow:**
En la acción HTTP, en el campo URI: `@{parameters('ENV_API_BASE_URL')}/endpoint`. Power Automate resuelve el parámetro en tiempo de ejecución.

---

## Limitaciones a conocer antes de integrar

| Limitación | Valor | Impacto |
|-----------|-------|---------|
| Tiempo máximo de respuesta al agente | 100 seg (~2 min en práctica) | Diseñar flows rápidos; mover lógica lenta post-respuesta |
| Tipos de datos en inputs/outputs del flow | Solo Text, Number, Boolean | No pasar arrays ni objetos directamente; serializar a string |
| Llamadas a APIs externas desde flow | Sin límite nativo, pero limitado por throttling del conector HTTP | Usar reintentos y backoff exponencial para APIs con rate limits |
| Tamaño máximo de respuesta HTTP | 100 MB en cloud flows | No recuperar documentos binarios completos — solo metadatos o URLs |
| Conectores premium | Requieren licencia Power Automate Premium o Power Apps Premium | SAP, Salesforce, ServiceNow, SQL Server (on-premises) son premium |

:::tip
Si la API externa tiene un rate limit bajo (por ejemplo, 10 llamadas por segundo), combinar esto con concurrencia 5 del patrón parent-child puede generar errores 429 rápidamente. Reducir la concurrencia o añadir un nodo Delay entre llamadas para respetar el rate limit del servicio externo.
:::
