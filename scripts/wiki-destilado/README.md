# Pipeline de destilado de libros

Pipeline reproducible para extraer los 95 PDF digitales y validar tandas de notas antes de
confirmarlas. Las fuentes con copyright continúan fuera de Git bajo `export/`; este directorio
solo versiona código, manifiesto y prompt.

## Dependencias

- Python 3.10 o posterior.
- Extracción: `pymupdf4llm` en un entorno virtual aislado.
- Validación: `PyYAML`. No se omite el parseo si falta: el comando termina con error.
- Build opcional: Node 22, npm y las dependencias ya instaladas en `wiki/`.

No se añaden dependencias al proyecto. Por ejemplo, puede reutilizarse un entorno local ya
preparado o instalar las dos dependencias Python en un venv externo al repositorio.

## Extracción y reanudación

Desde la raíz de `PAFE-Portal`:

```bash
# Comprobar selección sin escribir ni importar pymupdf4llm
python3 scripts/wiki-destilado/extract_pdf_markdown.py --dry-run

# Regenerar un libro por slug del manifiesto
python3 scripts/wiki-destilado/extract_pdf_markdown.py \
  --only El-Arte-del-Cambio

# Reanudar todos: solo omite salidas cuyo sidecar, hashes y páginas 1..N sean válidos
python3 scripts/wiki-destilado/extract_pdf_markdown.py
```

Cada salida se escribe primero en un temporal del mismo directorio y después se reemplaza
atómicamente. El sidecar `<libro>.md.extract.json` registra hashes, número de páginas y versión
del extractor. Las extracciones heredadas con marcadores `2..N+1` no son reanudables de forma
segura y se regenerarán.

## Validación de una tanda

```bash
# Primeras 20 notas
python3 scripts/wiki-destilado/validate_book_notes.py --batch 1:20

# Una tanda normal
python3 scripts/wiki-destilado/validate_book_notes.py --batch 21:30

# Tras un PASS determinista, ejecutar también el build de Quartz
python3 scripts/wiki-destilado/validate_book_notes.py --batch 21:30 --quartz
```

El validador comprueba el manifiesto completo y, para el lote seleccionado, paths, YAML y
campos, secciones y orden, 2-5 tags kebab-case, edges OKF, longitud 60-150, wikilinks, URL del
portal, 5-10 bullets en `Ideas clave`, marcadores fuente `1..N` y referencias de página dentro
del PDF. No lanza Quartz si hay errores.

Este gate es estructural. Un revisor independiente todavía debe comprobar cobertura de todos
los capítulos, exactitud clínica, correspondencia afirmación-evidencia y que la síntesis no
reproduzca de forma sustancial el texto original.
