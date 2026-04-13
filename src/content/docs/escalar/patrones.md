---
title: Patrones arquitectónicos
description: Los 9 patrones reutilizables para diseñar agentes de Copilot Studio robustos y escalables.
sidebar:
  order: 4
---

Los patrones son soluciones probadas a problemas recurrentes. No son recetas que se aplican mecánicamente — son marcos conceptuales que reducen el tiempo de diseño porque alguien ya resolvió el mismo problema y documentó cómo. Estos nueve patrones cubren los desafíos más comunes en agentes enterprise: desde cómo combinar fuentes de datos hasta cómo gobernar la seguridad, evaluar la calidad o gestionar el ciclo de vida.

## PAT-001 — Razonamiento multi-salto entre capas IQ

**Tipo:** Architecture pattern

**Problema:** Los agentes que consultan una única fuente producen respuestas planas. El valor real está en cruzar contexto humano, datos operativos y conocimiento documental en una sola ejecución.

**Implementación:**
```
Trigger (usuario o evento)
  → Work IQ: obtener contexto humano (¿quién trabaja en esto? ¿qué se discutió?)
  → Fabric IQ: consultar datos operativos (¿cuál es el impacto en métricas?)
  → Foundry IQ: recuperar conocimiento (¿qué dice la normativa o política?)
  → Síntesis: respuesta holística con razonamiento cruzado
```

**Cuándo usarlo:** Cuando la respuesta correcta requiere combinar información de fuentes heterogéneas — por ejemplo, auditoría de una transacción que necesita datos del aprobador (Work IQ), el impacto en margen bruto (Fabric IQ) y la política de control interno aplicable (Foundry IQ).

---

## PAT-002 — RAG con búsqueda híbrida adaptativa

**Tipo:** Prompt/Architecture pattern

**Problema:** La búsqueda puramente semántica falla con queries exactas (números de factura, códigos de artículo). La búsqueda por keywords falla con preguntas conceptuales.

**Implementación:**
```
Score = α × BM25(q,d) + (1-α) × CosineSim(embed(q), embed(d))
```
- α alto → queries exactas ("factura 2024-00381", "artículo 107.3")
- α bajo → queries conceptuales ("¿cuál es el riesgo de esta cláusula?")
- El valor de α se recalibra automáticamente — no requiere tuning manual

**Cuándo usarlo:** Cualquier agente con búsqueda documental donde los usuarios mezclan preguntas conceptuales y referencias exactas. Es el patrón de RAG más robusto para uso general.

---

## PAT-003 — Pre-indexación de metadatos con Knowledge Agent

**Tipo:** Flow pattern

**Problema:** Consultar documentos en tiempo real es lento y costoso en tokens. En bibliotecas de alto volumen (facturas, contratos, evidencias), el coste de consulta directa es prohibitivo.

**Implementación:**
```
1. Identificar bibliotecas de alto valor (facturas, contratos, evidencias)
2. Configurar Knowledge Agent + Autofill sobre SharePoint
3. Definir columnas de metadatos (fecha, tipo, importe, partes involucradas)
4. El sistema pre-indexa los datos proactivamente
5. Los agentes consultan metadatos indexados — no texto completo
```

**Cuándo usarlo:** Bibliotecas de SharePoint con cientos o miles de documentos donde los usuarios hacen consultas repetitivas sobre campos estructurados (fecha, importe, tipo). Documentada en 95% de exactitud en extracción de metadatos.

:::caution
Requiere licencia M365 Copilot Enterprise ($30/usuario/mes). No está disponible en M365 Copilot Business.
:::

---

## PAT-004 — Gobernanza de 4 capas en agentes

**Tipo:** Architecture pattern

**Problema:** Agentes que manejan información confidencial de múltiples usuarios o clientes pueden filtrar datos entre contextos si no hay controles en cada capa.

**Implementación:**
```
Cada query pasa por 4 filtros:
  1. Identidad → Entra ID (¿quién eres?)
  2. Fuente → Permisos heredados del repositorio (¿a qué tienes acceso?)
  3. Rol → Base de conocimiento (Propietario/Contribuidor/Lector)
  4. Documento → ACLs + etiquetas Purview (DLP)
```

**Cuándo usarlo:** Agentes que manejan datos de múltiples clientes, departamentos o niveles de confidencialidad. En Copilot Studio, las capas 1 y 2 funcionan automáticamente con "Authenticate with Microsoft" + SharePoint. Las capas 3 y 4 requieren configuración explícita de Purview.

---

## PAT-005 — Ontología como "Piedra Rosetta" entre áreas

**Tipo:** Architecture pattern

**Problema:** Distintos departamentos definen los mismos conceptos de forma diferente. "Revenue", "Cliente Activo" o "Margen Bruto" tienen definiciones distintas en finanzas, operaciones y ventas. Los agentes producen respuestas inconsistentes según qué fuente consultan.

**Implementación:**
```
Ontología de Fabric IQ:
  - Define entidades de negocio universales con definición canónica
  - Vincula cada entidad a las tablas/columnas físicas de cada sistema
  - Los agentes consultan la ontología, no las tablas directamente
  - La ontología resuelve la "deriva semántica" automáticamente
```

**Cuándo usarlo:** Agentes que cruzan datos de múltiples sistemas con definiciones inconsistentes. Requiere Direct Lake Mode para integración completa con Fabric IQ.

---

## PAT-006 — Pensamiento nativo del modelo (Token Optimization)

**Tipo:** Prompt pattern

**Problema:** RAG tradicional inyecta todos los documentos recuperados en la ventana de contexto. Con 50+ documentos relevantes, el coste en tokens se vuelve prohibitivo.

**Implementación:**
```
Modelo con "Pensamiento" nativo (extended thinking):
  1. Recibe los documentos recuperados por Foundry IQ
  2. RAZONA sobre ellos ANTES de consumirlos completamente
  3. Detecta contradicciones entre fuentes
  4. Evalúa precisión fáctica
  5. Consolida solo lo relevante → output fundamentado
```

**Cuándo usarlo:** Análisis profundo sobre múltiples documentos donde el razonamiento cruzado justifica el coste del modelo Pro. Para queries simples, el modelo estándar es más eficiente.

:::tip
Reserva este patrón para casos donde la calidad del razonamiento es crítica (due diligence, análisis regulatorio). Para el 80% de las consultas de soporte o FAQ, un modelo estándar con RAG básico es más que suficiente.
:::

---

## PAT-007 — Pipeline de evaluación de agentes (8 pasos)

**Tipo:** Quality pattern

**Problema:** Los agentes se despliegan sin medición sistemática de calidad. Sin evaluación continua, no hay forma de saber si el agente mejora o empeora con cada cambio.

**Implementación:**
```
Pipeline de 8 pasos:
  1. Definir dimensiones: groundedness, relevancia, coherencia, completitud
  2. Construir ground truth sintético (Q&A esperados por dominio)
  3. Configurar rúbrica de evaluación (1-5 por dimensión)
  4. LLM-as-Judge (modelo evaluador con rúbrica inyectada)
  5. Automatizar en CI/CD (cada PR dispara la evaluación)
  6. Umbrales de calidad (ej: groundedness >= 4.0 para pasar a prod)
  7. Monitorizar drift en producción (conversation analytics + Activity Map)
  8. Retroalimentar: fallos en prod → nuevos casos en ground truth
```

**Cuándo usarlo:** Agentes con actualizaciones frecuentes del system prompt o topics, agentes de alta criticidad, o cualquier contexto donde necesitas evidencia objetiva de que el agente funciona como se espera.

---

## PAT-008 — MCP Gateway empresarial

**Tipo:** Architecture pattern

**Problema:** Agentes que conectan directamente a herramientas externas crean una superficie de ataque incontrolable. Cada conexión directa requiere gestión individual de auth, rate limits, logging y permisos.

**Implementación:**
```
MCP Gateway como punto único de control:
  1. Control centralizado: auth (OAuth 2.1), routing, rate limits, discovery
  2. Frontera de seguridad: TLS/mTLS, OAuth scopes por tool, permisos granulares
  3. Policy-as-code: OPA para evaluar políticas en runtime
  4. Guardrails: filtrado PII pre/post, sanitización de I/O
  5. Multi-tenancy: límites explícitos por tenant, contenedores aislados
  6. Observabilidad: tracing, logging, métricas por tool call
  7. Resiliencia: HA, autoscaling, circuit breakers, retries idempotentes
  8. Compatibilidad: negociación de capacidades, version pinning, kill switches
```

**Cuándo usarlo:** Organizaciones con múltiples agentes accediendo a múltiples herramientas externas donde se necesita auditoría centralizada, control de acceso granular y rate limiting. Es el patrón de integración para entornos enterprise con requisitos de compliance (SOX, GDPR, HIPAA).

---

## PAT-009 — ADLC: Agent Development Lifecycle

**Tipo:** Process pattern

**Problema:** Las prácticas clásicas de SDLC no cubren la naturaleza probabilística y adaptativa de los agentes de IA. Los agentes se despliegan sin evaluación sistemática, sin gobernanza adecuada y sin monitorización del razonamiento.

**Implementación — 6 fases basadas en DevSecOps extendido:**

```
PLAN
├── Definir caso de uso, KPIs, riesgo aceptable
├── Crear charter con métricas de éxito
└── Evaluar build vs buy, ground truth sintético, RBAC temprano

CODE & BUILD
├── Prompts-as-code (versionados, testeados)
├── Herramientas gobernadas via MCP Gateway
└── Escaneo de vulnerabilidades (prompt injection, adversarial)

TEST & RELEASE
├── Evaluación automatizada en CI/CD (drift, precisión, coste)
├── Red teaming y benchmarks
└── Gobernanza por catálogos certificados

DEPLOY
├── Feature flags + canary/shadow deployments
├── Kill-switch obligatorio
└── Infraestructura compliance-aware

MONITOR
├── Observabilidad MELT (Metrics, Events, Logs, Traces)
├── Trazas de razonamiento y uso de herramientas
└── SLOs por calidad, seguridad, operación y negocio

OPERATE
├── Catálogo gobernado de agentes certificados
├── Audit logs y evidencia
└── Plan de deprecación y retirada
```

**El cambio de paradigma clave:**
- De **determinista** a **probabilístico** — los agentes toman decisiones dinámicas que varían
- De **code-first** a **evaluation-first** — el éxito depende de medición sistemática, no solo de implementación
- La pregunta pasa de "¿está arriba?" a "¿está respondiendo bien?"

**Cuándo usarlo:** Cualquier agente que llega a producción real con usuarios reales. El nivel de rigor que aplicas de cada fase depende de la criticidad del caso de uso, pero las 6 fases deberían estar al menos contempladas.

---

## Guía de selección rápida

| Si tu problema es... | Considera... |
|---------------------|-------------|
| Respuestas planas que no cruzan fuentes | PAT-001 |
| Búsqueda que falla con queries exactas O conceptuales | PAT-002 |
| Consultas lentas en bibliotecas grandes | PAT-003 |
| Datos de múltiples clientes en el mismo agente | PAT-004 |
| Definiciones inconsistentes entre departamentos | PAT-005 |
| Coste de tokens desbordado por muchos documentos | PAT-006 |
| Sin forma de saber si el agente mejora o empeora | PAT-007 |
| Múltiples agentes conectando a múltiples herramientas | PAT-008 |
| Sin proceso formal para el ciclo de vida del agente | PAT-009 |
