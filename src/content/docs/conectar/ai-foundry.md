---
title: Azure AI Foundry
description: RAG con búsqueda híbrida, extracción inteligente de documentos y pipelines multi-paso para casos que Copilot Studio nativo no puede resolver.
sidebar:
  order: 3
---

Azure AI Foundry es la capa de infraestructura de IA de Microsoft. Copilot Studio cubre mucho terreno con sus Knowledge Sources y Prompt Tools, pero hay casos donde necesitas más: indexación vectorial sobre miles de documentos, extracción estructurada de contratos con confidence scores, o pipelines de IA multi-paso que combinan modelos, código y APIs externas.

Para esos casos, AI Foundry es la respuesta. Esta sección cubre las tres capacidades más relevantes para implementaciones enterprise con Copilot Studio.

---

## RAG con Azure AI Search — Búsqueda híbrida

### Qué resuelve y cuándo usarlo

RAG (Retrieval-Augmented Generation) extiende el agente con documentos propios: en vez de depender de lo que el modelo "sabe", primero recupera fragmentos relevantes de tus documentos y los inyecta como contexto para generar una respuesta fundamentada. Azure AI Search es el motor de recuperación.

La clave es la **búsqueda híbrida**: combina tres modos en paralelo:

| Modo | Qué busca | Fortaleza |
|------|-----------|-----------|
| **Keyword (BM25)** | Coincidencia exacta de palabras | Preciso para IDs, artículos, referencias normativas |
| **Vector (embeddings)** | Similitud semántica | Entiende sinónimos, reformulaciones, multilingüe |
| **Semantic ranking** | Re-ranking por significado | Mejora precisión del top-N final |

Los dos primeros se ejecutan en paralelo, sus resultados se fusionan con **Reciprocal Rank Fusion (RRF)**, y el semantic ranking reordena el resultado combinado. Esto resuelve lo que ningún modo individual puede: una query como "opciones de extensión" encuentra tanto "extensión" literal (keyword) como "prorroga" y "renovación" (vector).

Usar RAG con AI Search cuando:
- El volumen de documentos supera lo que cabe en el contexto del LLM (más de 20-30 páginas)
- Se necesita citar fuentes y evitar alucinaciones
- Las queries mezclan referencias exactas ("artículo 107.3") y conceptuales ("excepciones intracomunitarias")

No usar cuando:
- Son menos de 20 páginas en total → SharePoint como Knowledge Source en CS es suficiente
- Los datos son estructurados en tablas → Dataverse o SQL directo
- Solo se necesita buscar en web pública → Bing grounding en CS

### Arquitectura básica

```
[Documentos: PDF, DOCX, SharePoint, Blob]
  ↓
[AI Search: Indexer + Skillset]
  ├── OCR (para PDFs escaneados)
  ├── Chunking: 1.500 tokens, 300 de overlap
  ├── Embedding: text-embedding-3-large (3.072 dimensiones)
  └── Índice: content + contentVector + title + source + category
  ↓
[Búsqueda híbrida: keyword + vector + semantic ranking]
  ↓
[Inyección como contexto al LLM → respuesta fundamentada con citas]
```

### Configuración del índice

El índice mínimo para RAG híbrido necesita estos campos:

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | string (key) | Identificador único del chunk |
| `content` | string (searchable) | Texto del chunk para keyword search |
| `contentVector` | Collection(Single) | Embedding para vector search |
| `title` | string (filterable) | Título del documento origen |
| `source` | string (filterable) | URL o path para citas |
| `category` | string (filterable) | Clasificación del documento |

Algoritmo vectorial: **HNSW** en casi todos los casos — rápido y casi tan preciso como KNN, que es órdenes de magnitud más lento a escala.

### Conectar con Copilot Studio

La forma más directa: en Copilot Studio → Agent → Knowledge → Add knowledge → **Azure AI Search**. Configurar endpoint, key e índice. CS gestiona automáticamente la query híbrida y la inyección al LLM.

Si necesitas más control sobre el pipeline (filtros por cliente, metadatos de seguridad, lógica de pre/post-procesamiento), la alternativa es un cloud flow que llama a la API de AI Search y pasa los resultados al agente como Tool.

:::caution
Semantic ranking tiene un límite gratuito de 1.000 queries/mes en el tier Standard S1. Para agentes con alto volumen de consultas, planificar el coste antes de activarlo en producción. El tier Basic no soporta vectores — mínimo Basic para desarrollo, Standard S1 para producción.
:::

### Parámetros clave de chunking

| Parámetro | Recomendado | Motivo |
|-----------|-------------|--------|
| Tamaño de chunk | 1.000-2.000 tokens | Balance entre contexto y precisión |
| Overlap | 200-500 tokens | Evita perder información en los bordes |
| Separador | Por páginas o secciones | Mantiene coherencia semántica |

:::tip
Incluye siempre el campo `source` (URL o path del documento) en cada chunk. Es lo que permite al agente citar la fuente de cada respuesta, crítico en contextos de auditoría o compliance donde "el agente dijo X" no es suficiente sin evidencia trazable.
:::

---

## Content Understanding — Extracción estructurada de documentos

### Qué resuelve y cuándo usarlo

Azure Content Understanding transforma documentos no estructurados (contratos, facturas, informes) en datos estructurados con confidence scores y trazabilidad al texto fuente. Es la evolución de Document Intelligence, con la diferencia fundamental: no solo extrae lo que está literalmente en el documento, sino que puede **inferir** campos que no existen como tal.

La distinción entre los tres métodos de extracción es lo que hace esto útil en la práctica:

| Método | Qué hace | Ejemplo |
|--------|----------|---------|
| **extract** | Saca lo que está literalmente en el documento | Nombre de las partes, fechas, importes |
| **classify** | Categoriza según opciones predefinidas | Tipo de contrato, jurisdicción, nivel de riesgo |
| **generate** | Infiere o calcula valores no explícitos | Compromiso total = renta anual × duración |

Usar Content Understanding cuando:
- Los documentos tienen estructura variable (contratos de diferentes plantillas, facturas de múltiples proveedores)
- Se necesitan campos inferidos además de extractivos
- El volumen justifica automatización (más de 10-20 documentos con el mismo tipo de análisis)
- Se necesita confidence score para decidir automáticamente vs. revisión humana

### Definir un Custom Analyzer

El analyzer es la pieza central: define el schema de campos a extraer. Ejemplo para contratos de arrendamiento (caso AR-001):

```json
{
  "fields": [
    {"name": "arrendador", "type": "string", "method": "extract",
     "description": "Nombre del arrendador (propietario del inmueble)"},
    {"name": "renta_anual_eur", "type": "number", "method": "extract",
     "description": "Renta anual en EUR, sin IVA"},
    {"name": "tiene_opcion_extension", "type": "boolean", "method": "extract",
     "description": "Si el contrato incluye opción de prórroga o extensión"},
    {"name": "compromiso_total_eur", "type": "number", "method": "generate",
     "description": "Compromiso financiero total: renta anual × duración en años (incluir extensión si es razonablemente cierta)"},
    {"name": "clasificacion_niif16", "type": "string", "method": "classify",
     "description": "FINANCE_LEASE si duración > 75% vida útil o VPN pagos > 90% valor razonable, OPERATING_LEASE en caso contrario",
     "enum": ["FINANCE_LEASE", "OPERATING_LEASE", "UNCERTAIN"]}
  ]
}
```

La respuesta incluye para cada campo:
- `value`: el valor extraído o generado
- `confidence`: score de 0 a 1
- `source`: región del documento donde se encontró (para auditoría)

### Estrategia de automatización por confidence

| Score | Acción |
|-------|--------|
| ≥ 0.90 | Procesamiento automático sin revisión |
| 0.70 - 0.90 | Revisión rápida (highlight del campo en el documento) |
| < 0.70 | Review humano obligatorio |

Los campos `generate` (inferidos) siempre tienen confidence menor que los `extract` (directos). No esperar 0.95 en un cálculo inferido — ajustar los umbrales por tipo de método.

:::tip
Las descripciones de campo son el "prompt" para el modelo. Descripciones vagas generan extracciones vagas. "Renta anual en EUR, sin IVA" es significativamente mejor que "renta". Invertir tiempo en las descripciones antes de escalar el volumen.
:::

:::caution
Content Understanding cobra por página más tokens del modelo generativo. Un contrato de 50 páginas con 9 campos puede costar entre 2 y 5 USD. Calcular el coste por volumen antes de escalar. Para documentos con plantilla fija y pocos campos, Document Intelligence es más barato.
:::

### Integración con el pipeline

Content Understanding alimenta dos flujos de datos complementarios:

1. **Structured data store**: los campos extraídos van a Dataverse o SharePoint como datos estructurados, consultables directamente por el agente sin RAG
2. **RAG preprocessing**: Content Understanding genera markdown limpio del documento (incluyendo descripciones de figuras y tablas) que se indexa en AI Search para búsqueda de texto libre

El pipeline óptimo para documentos complejos combina ambos: extrae campos clave con Content Understanding Y indexa el texto completo en AI Search. El agente puede responder tanto preguntas estructuradas ("¿cuál es la renta anual del contrato de Madrid?") como preguntas de texto libre ("¿qué dice el contrato sobre penalizaciones por rescisión anticipada?").

---

## Prompt Flows — Pipelines multi-paso con LLMs

### Qué resuelve y cuándo usarlo

Prompt Flow es la herramienta de AI Foundry para construir, testear, evaluar y desplegar pipelines de IA que encadenan múltiples pasos: prompts, llamadas a modelos, código Python, herramientas externas. Se representa visualmente como un DAG (grafo acíclico dirigido) donde cada nodo es una operación.

La diferencia con un Prompt Tool en Copilot Studio es la escala: donde un Prompt Tool resuelve un paso, Prompt Flow resuelve un pipeline completo con variantes de prompt, evaluación sistemática de calidad, y despliegue como endpoint REST.

Usar Prompt Flow cuando:
- El pipeline de IA necesita múltiples pasos encadenados donde el output de un LLM alimenta el siguiente
- Se necesita comparar variantes de prompts de forma sistemática (A/B testing real, no intuitivo)
- Se requiere evaluación automatizada de calidad antes de desplegar cambios
- El resultado se expone como endpoint REST consumible desde Power Automate o cualquier app

### Tipos de nodos

| Tipo | Qué hace |
|------|----------|
| **LLM** | Llama a un modelo con un prompt template |
| **Python** | Ejecuta código custom (validación, cálculos, parsing) |
| **Tool** | Herramientas integradas (AI Search, SERP API) |
| **Prompt** | Template de prompt con variables |

La regla práctica: usar nodos Python para lógica determinista (validación, cálculos, formateo). No pedir al LLM que haga matemáticas o validaciones que un `if` resuelve en un microsegundo.

### Ejemplo: pipeline de análisis de contratos (3 nodos)

```
[Input: contract_text, client_name]
  ↓
[Nodo 1: LLM — Extraer cláusulas]
  Model: GPT-4.1 | Temperature: 0
  Output: clausulas_json
  ↓
[Nodo 2: Python — Validar y calcular]
  Calcular duración, compromiso total, clasificación NIIF 16
  Output: clausulas_enriquecidas
  ↓
[Nodo 3: LLM — Generar resumen ejecutivo]
  Model: GPT-4.1 | Temperature: 0.3
  Output: resumen_ejecutivo
```

El nodo Python en el medio es lo que hace este pipeline más fiable que pedir al LLM que haga todos los pasos de una vez: los cálculos son exactos, no aproximados.

### Variantes y evaluación de calidad

Las variantes permiten comparar versiones de un prompt sobre los mismos datos de test. Resultado real del caso AR-001:

| Variante | Estilo de prompt | Groundedness | Accuracy |
|---------|-----------------|-------------|---------|
| V1 | Directo | 3.8/5 | 82% |
| V2 | Few-shot (2 ejemplos) | 4.3/5 | 91% |
| V3 | Chain-of-thought | 4.1/5 | 88% |

La diferencia entre V1 y V2 es 9 puntos de accuracy. Eso no se intuye — se mide.

El **Evaluation Flow** es la pieza que cierra el loop: evalúa automáticamente groundedness (¿la respuesta se basa en los datos?), relevancia y coherencia usando otro LLM como juez. Establecer umbrales mínimos (groundedness ≥ 4.0 para producción) convierte esto en un sistema de calidad continuo, no un check puntual.

:::tip
Desplegar el Prompt Flow como endpoint REST y consumirlo desde Power Automate (acción HTTP) o desde Copilot Studio via Tool permite mantener la lógica multi-paso fuera del agente. El agente invoca un endpoint especializado y recibe el resultado ya procesado — separación de responsabilidades que facilita el mantenimiento.
:::

:::caution
Prompt Flow está disponible en el **Foundry Classic portal** (ai.azure.com). El nuevo portal está en transición. Verificar la disponibilidad de la funcionalidad completa antes de empezar un proyecto. El coste del endpoint managed es continuo (compute activo) — para uso esporádico, considerar arquitecturas serverless o llamar al flow solo bajo demanda.
:::

---

## Cuándo escalar a AI Foundry

La pregunta concreta: ¿cuándo sale de Copilot Studio nativo y entra en AI Foundry?

| Capacidad | CS nativo | AI Foundry |
|-----------|-----------|------------|
| Knowledge source sobre documentos propios | Hasta ~100 docs simples | Miles de docs, búsqueda híbrida, filtros |
| Extracción de datos de documentos | Prompt Tool básico | Content Understanding con confidence y grounding |
| Pipeline de IA multi-paso | Un solo Prompt Tool | Prompt Flow con evaluación sistemática |
| Evaluación de calidad del agente | Manual / ad hoc | Evaluation Flows automatizados |
| Control de costes por operación | Limitado | Total (tier de Search, modelo, chunking, top-k) |

La respuesta honesta: para la mayoría de casos piloto y producción estándar, Copilot Studio nativo es suficiente. AI Foundry entra cuando el volumen de documentos es grande, la precisión es crítica (contextos de auditoría, legal, compliance), o se necesita evaluar y mejorar sistemáticamente la calidad del agente.
