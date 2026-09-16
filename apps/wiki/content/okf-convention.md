---
type: concept
title: Convención OKF de la Wiki PAFE
description: Formato, tipos, edges de topología y taxonomía de tags de las notas de la wiki de conocimiento para psicólogos PAFE
tags: [okf, documentation]
---

# Qué es una nota OKF en esta wiki

Una nota OKF es un fichero markdown dentro de `wiki/content/` que participa en el grafo de conocimiento de la wiki. Todo `**/*.md` de `content/` se publica; lo que hace OKF a una nota es su frontmatter, su sección `# Topology` y sus enlaces.

Esta convención adapta la **OKF del proyecto singular-solving** (a su vez, OKF v0.2 de Mileto) al dominio de la psicología y la terapia familiar. Adaptaciones declaradas:

1. **Dominio clínico**: los tipos modelan conocimiento psicológico destilado de una biblioteca de 160 obras (95 digitales con texto completo extraído en `export/text/r2-files-md/`).
2. **Trazabilidad obligatoria a la obra**: toda afirmación clínica deriva de un libro concreto y se cita. La wiki **no reproduce los libros** — son obras publicadas con copyright; cada nota de libro enlaza al recurso original en el portal PAFE.
3. **No hay consejo clínico directo**: la wiki es material de consulta profesional, no sustituye juicio clínico ni supervisión.

# Frontmatter

```yaml
---
type: <uno del set cerrado>
title: Título legible de la nota
description: Una línea resumiendo el contenido
tags: [kebab-case]
---
```

`type` es el único campo obligatorio y su valor viene del **set cerrado** — no inventes tipos nuevos; extiende esta convención primero.

# Type schema

**Tipos de fuente** — de dónde viene el conocimiento:

| Type | Qué modela | Ejemplo aquí |
|---|---|---|
| `book` | Una obra de la biblioteca: ficha + destilado de su contenido | [[libros/200-Tareas-en-Terapia-Breve]] |
| `author` | Un autor de una o varias obras | Giorgio Nardone, Salvador Minuchin |

**Tipos de conocimiento** — qué *dice* una nota:

| Type | Qué modela |
|---|---|
| `concept` | Un modelo, teoría o constructo (p.ej. doble vínculo, homeostasis familiar) |
| `protocol` | Una técnica o procedimiento clínico aplicable (p.ej. prescripción del síntoma, reencuadre) |
| `instrument` | Un test, escala o instrumento de evaluación |
| `topic` | Una síntesis transversal que conecta varias obras sobre un mismo tema |
| `claim` | **Una sola afirmación** transversal al corpus, con su fundamento y su alcance. Es la unidad atómica: se escribe cuando la misma tesis ha tenido que repetirse en tres o más notas, para factorizarla y poder recombinarla |
| `guide` | Una **ruta de entrada por situación** práctica: qué valorar primero, qué está contraindicado y qué leer. No sintetiza un tema, orienta un recorrido |
| `report` | Un índice, análisis o estado de la wiki en un momento dado (los índices de libros/autores) |

**Slug ownership**: las notas `concept`, `protocol` e `instrument` poseen el slug pelado (`[[reencuadre]]`, `[[doble-vinculo]]`); las notas `book` viven bajo `libros/` y las `author` bajo `autores/`. Nunca dejes que un libro haga sombra al slug de un concepto.

**Secciones obligatorias por tipo** (las comprueba `validate_knowledge_notes.py`):

| Type | Primera h2 | Secciones requeridas |
|---|---|---|
| `concept` / `topic` / `instrument` | `## Qué es` · `## De qué trata` · `## En qué consiste` | `## En la biblioteca`, `## Cautelas y límites` |
| `protocol` | idem | `## Procedimiento`, `## Indicaciones`, `## Cautelas y límites` |
| `claim` | `## Qué afirma` | `## En qué se apoya`, `## Alcance y límites`, `## Dónde se aplica` |
| `guide` | `## Cuándo aplica` | `## Qué valorar primero`, `## Qué está contraindicado`, `## Qué leer` |

# Sección Topology

Toda nota abre sus relaciones en una sección `# Topology` con edges etiquetados:

```markdown
# Topology

* **About**: [[adolescencia]], [[conflicto-familiar]]
* **Uses**: [[escala-de-ansiedad-infantil]]
* **Part of**: [[terapia-breve]]
* **Cites**: [[libros/Adolescentes-y-Familias-en-Conflicto.-Manual-de-Tratamiento]]
```

Etiquetas de edge (set cerrado, extiéndelo aquí primero): `Part of`, `Contains`, `Uses`, `Depends on`, `About`, `Cites`, `Authored by`.

Semántica por edge:

- **`Cites`** (→ nota `book`): la nota deriva de esa obra. Toda nota `concept`, `protocol`, `instrument` o `topic` debe tener **al menos un** `Cites`. Sin inversa declarada — el libro muestra la relación como entrante.
- **`About`** (→ problema clínico, población o área): de qué trata la nota. Los problemas clínicos son notas `concept` o `topic` (p.ej. [[adicciones]], [[adolescencia]], [[pareja]]).
- **`Uses`**: un `protocol` usa un `instrument`, o un modelo usa un concepto.
- **`Part of` / `Contains`**: jerarquía (una técnica `Part of` un modelo; un tema `Contains` sus sub-temas).
- **`Depends on`**: un protocolo requiere entender antes otro concepto.
- **`Authored by`**: una nota `book` → sus notas `author`.

**Declara cada relación una sola vez** — el grafo deriva la inversa. Lado preferente: el hijo (`Part of`), el usuario (`Uses`), la nota de conocimiento (`Cites`, `About`), el libro (`Authored by`).

# Reglas

1. **Colocación**: la ruta es la URL. Libros en `libros/`, autores en `autores/`, temas en `temas/`, conceptos en `conceptos/`, protocolos e instrumentos en `protocolos/`, afirmaciones en `tesis/` y rutas de entrada en `rutas/`.
2. **Folder notes**: `<dir>/index.md` es la nota índice de la carpeta.
3. **Wikilinks**: enlaza con `[[slug]]` o `[[slug|texto]]`. Un wikilink a una nota que aún no existe no es un error — marca documentación pendiente. El umbral operativo que sigue la wiki es **3 enlaces entrantes**: cuando un destino alcanza tres referencias, se le escribe nota. Los destinos con una o dos quedan como backlog explícito.
4. **Inferencia marcada**: lo no respaldado por una fuente se marca en cursiva como *inferencia*.
5. **Citations**: toda nota destilada cierra con `# Citations` indicando obra y localización (capítulo/página) de donde se tomó cada bloque.
   - **Fase 1 (destilado)**: cita con capítulo/sección y, si el texto extraído lo permite, página del PDF.
   - **Fase 2 (hidratación, final)**: se revisan las citas y se fija la página exacta de la edición impresa. Los `.md` de `export/text/r2-files-md/` llevan marcadores `<!-- p. N -->` con la paginación del PDF para localizar cada referencia sin búsqueda manual.
6. **Copyright**: no se copian fragmentos extensos de las obras. Cita textual máxima: una frase, entre comillas y con página. El valor de la wiki es la síntesis, no la reproducción.
7. **Sin PII ni datos de pacientes**: jamás datos de casos reales identificables.
8. **Tags**: planos, kebab-case, 2-5 por nota. Facetas: enfoque terapéutico (`sistemico`, `estrategico`, `narrativo`, `estructural`, `terapia-breve`, `constructivismo`…) + problema clínico (`adolescencia`, `pareja`, `adicciones`, `violencia-familiar`, `escolar`, `trauma`…) + ciclo vital (`infancia`, `adolescencia`, `adultos`, `familia`).

# Nota de libro: estructura mínima

```markdown
---
type: book
title: <Título de la obra>
description: Una línea
tags: [...]
---

# Topology

* **Authored by**: [[autores/...]]
* **About**: [[...]]

## Ficha
Autor/a(s), año, editorial *(si consta en la fuente)*, enlace al recurso en el portal PAFE.

## De qué va
## Ideas clave
## Técnicas y protocolos
## Para qué casos sirve

# Citations
* Texto completo extraído: `export/text/r2-files-md/<fichero>.md`
```

# Publicación

Quartz 5 vendorizado en `wiki/` (config: `wiki/quartz.config.yaml`). Preview: `npx quartz build --serve` con Node ≥22. Los índices de libros y autores se regeneran con `wiki/scripts/generate-indexes.py`.
