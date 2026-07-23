# Implementación del LMS de PAFE (migración desde Moodle)

Conclusiones de diseño para convertir la web PAFE en el sustituto del Moodle de
formación (`agintzari`), migrando sus cursos. Documento de referencia; la
jerarquía real de cada curso está en [`courses/`](./courses/README.md).

> Fecha: 2026-07-24. Fuentes: FlowGraph (fases 1 y 2 ya implementadas),
> [`../../FLOWGRAPH_ROADMAP.md`](../../FLOWGRAPH_ROADMAP.md),
> [`../../PLUGIN_EVOLUTION.md`](../../PLUGIN_EVOLUTION.md).

## Principio rector: es aditivo, no reescribe nada

El LMS es un **envoltorio por encima de lo ya construido**. FlowGraph (motor,
editor, evidencia con replay), `Tasks`/`TasksCompleted` y `questionnaire-executions`
se quedan **exactamente igual**. Lo nuevo es una colección contenedora y un tipo
de pregunta de subida. Si mañana se retirara el LMS, todo lo anterior seguiría
funcionando solo.

## Las dos jerarquías

### Dónde vive un curso y cómo llega la familia

```
Web PAFE
├── Colección "Formaciones"            🆕  (aquí viven los cursos migrados)
│     └── Formación "ABUSO SEXUAL"  ── documento Lexical con bloques
└── Caso de la familia (ya existe)
      └── Tarea "Haz la formación: X"  ──►  Formación X
            └── al completarla → TasksCompleted + evidencia (fase 1)
```

### Qué hay dentro de un curso

Un curso es **un documento Lexical que se lee en orden, hecho de bloques**:

```
Formación "SESIONES INFORMATIVAS"
├── 🅣 Contenido      texto con formato                 (Moodle: page / label)
├── 📄 Fichero        PDF/doc descargable               (Moodle: resource / folder)
├── 🔗 Enlace         enlace externo                    (Moodle: url)
└── ❓ Cuestionario   embebe un GuidedQuestionnaire      (Moodle: feedback / quiz / assign)
```

## Modelo de datos

### Colección `Formaciones` (nueva, fina)

Prácticamente un campo rich-text Lexical + metadatos. Reutiliza el editor y el
renderer Lexical que la app ya usa (mismo mecanismo que el bloque
`questionnaireResource` existente y el commit "lexical block to pages").

### Cuatro tipos de bloque Lexical

| Bloque | Contenido | Se apoya en |
|--------|-----------|-------------|
| 🅣 **Contenido** | Texto con formato, imágenes | Lexical nativo |
| 📄 **Fichero** | Archivo descargable | `Media`/`Files` (ya existen) |
| 🔗 **Enlace** | Enlace externo | `ExternalResources` (ya existe) |
| ❓ **Cuestionario** | Embebe un `GuidedQuestionnaire` | FlowGraph (fases 1 y 2) |

Todo lo **interactivo** vive dentro del bloque Cuestionario (FlowGraph):
preguntas normales, **preguntas de subida**, y el **routing/ramificación** entre
ellas. No hay un quinto bloque de "entrega" suelto — una entrega es un
cuestionario con una pregunta de subida.

## Decisión clave: la subida de adjuntos es una *pregunta* de FlowGraph

Requisito de producto: las familias suben archivos (el módulo `assign` de Moodle).
Se implementa como un **tipo de pregunta `upload` dentro de FlowGraph**, no como
un bloque aparte. Motivo: así la subida **participa en el routing** (ramificar o
condicionar según lo subido), que es la razón de tenerlo en el motor y no fuera.

La regla que lo hace posible sin romper la pureza del motor:

> **La respuesta guardada en el log de eventos es una *referencia* al archivo, no
> los bytes:** `{ fileId, hash, nombre, tamaño, tipo }`.

Consecuencias:

- **El I/O ocurre en el host, no en `flowgraph-core`.** El renderer sube el
  archivo (async) a una server action; solo cuando termina, se despacha la
  respuesta `ANSWER` con la referencia. El núcleo sigue siendo puro y síncrono.
- **El replay sigue determinista.** El motor solo valida la forma de la
  referencia (como cualquier `answerSchema`); nunca necesita los bytes.
- **La evidencia se refuerza.** El evento guarda el **hash** del archivo en el
  momento de responder. Si el fichero se altera después, el hash no cuadra →
  a prueba de manipulación. Es mejor prueba que un adjunto suelto.
- **Autorización/antivirus/retención** son responsabilidad de la server action
  de subida (patrón ya usado en `submitQuestionnaireExecution`), fuera del motor.

Este es exactamente el patrón que el roadmap reservaba para adjuntos y loaders:
el I/O en el borde del host, el motor consume el resultado capturado. Requiere un
nuevo plugin de pregunta (`upload`) con sus capacidades de guard (answered / tipo
/ tamaño) y un renderer con subida async; **no toca el core**. Sujeto a la
política de evolución de plugins ([`../../PLUGIN_EVOLUTION.md`](../../PLUGIN_EVOLUTION.md)).

## Mapeo Moodle → PAFE

| Módulo Moodle | Nº total | Destino PAFE |
|---------------|----------|--------------|
| `resource` | 149 | 📄 bloque Fichero (Media) |
| `page` | 60 | 🅣 bloque Contenido (HTML→Lexical) |
| `url` | 41 | 🔗 bloque Enlace (ExternalResources) |
| `label` | 6 | 🅣 bloque Contenido (en línea) |
| `folder` | 6 | 📄 bloque Fichero (varios Media) |
| `feedback` | 2 | ❓ Cuestionario (FlowGraph) — mapeo directo |
| `quiz` | 1 | ❓ Cuestionario (FlowGraph) |
| `assign` | 91 | ❓ Cuestionario con **pregunta de subida** |
| `pdfannotator` | 2 | 📄 bloque Fichero (PDF) |
| `forum` | 120 | 💬 **fuera de alcance** |
| H5P | — | interactivo propietario — **fuera por ahora** |

Los 2 cuestionarios `feedback` (curso 4) tienen ítems `numeric`, `multichoice`,
`info`, `pagebreak` → mapean directos a `number`, `select`, contenido Lexical y
límite de página. El motor de preguntas **casi no necesita tipos nuevos**; el
grueso del trabajo es migrar contenido + ficheros y construir la subida.

## Alcance

**Dentro:** contenido (páginas/rótulos), ficheros (163 PDFs, 275 MB), enlaces,
los 2 cuestionarios, y las entregas con subida.

**Fuera (por ahora):**
- **Foros** (120): PAFE no tiene comunidad ni módulo de foro; la comunicación va
  por otro canal. Replicarlos es otro proyecto.
- **H5P**: formato interactivo propietario; verificar si es relevante antes de
  invertir (se sospecha anecdótico).

**Cursos:** 9 cursos reales (id 4,7,8,9,10,11,12,13,14; el id 1 es el sitio). El
14 "(NO PAFE)" parece duplicado del 7 → probablemente no se migra. Los pares
8/12 (libro de Aznárez) y 11/13 (sistémico acogedores/profesionales) se migran
ambos salvo indicación contraria.

## Qué se reutiliza y qué se construye

**Se reutiliza (sin tocar):** motor FlowGraph, editor visual + condition builder
(fase 2), persistencia con replay en servidor y evidencia (fase 1), política de
evolución de plugins, `Tasks`, `TasksCompleted`, `Media`/`Files`,
`ExternalResources`, editor/renderer Lexical.

**Se construye nuevo:**
1. Colección `Formaciones` (rich-text Lexical + metadatos) y su bloque Cuestionario.
2. Bloques Lexical Fichero y Enlace (si no existen ya como tal).
3. Plugin de pregunta **`upload`** (referencia+hash) y su server action de subida.
4. **ETL de migración**: extraer de Moodle (páginas HTML, PDFs, feedback) →
   transformar (HTML→Lexical, ficheros→Media) → cargar en `Formaciones`.

## Plan de implementación (fases)

1. **Plugin `upload`** — pregunta de subida (referencia+hash) + server action con
   propiedad/antivirus; guards answered/tipo/tamaño. No depende de nada más.
2. **Colección `Formaciones`** + bloques Contenido/Fichero/Enlace/Cuestionario
   sobre el editor Lexical.
3. **Extractor Moodle** — baja estructura, páginas HTML y ficheros (`mdl_files`).
4. **Transformador** — HTML de Moodle → estado Lexical; PDFs → `Media`;
   `feedback` → `GuidedQuestionnaire`.
5. **Carga y verificación** — crear las 8–9 Formaciones y comprobar que cada una
   se ve y navega.

## Decisiones de producto abiertas

- **Revisión de entregas:** el archivo subido queda con la familia como
  propietaria y visible al profesional del caso. ¿Hace falta corrección/nota
  formal, o basta con registrado+descargable? (asunción actual: lo segundo).
- **Foros / H5P:** confirmar que quedan fuera.
- **Duplicados:** confirmar que el 14 (No PAFE) no se migra.
