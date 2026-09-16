---
title: Wiki PAFE — Conocimiento para psicólogos
---

Bienvenido a la wiki de conocimiento PAFE. Esta wiki **destila el conocimiento útil para la práctica psicológica** de la biblioteca de terapia familiar y psicología sistémica del portal.

## Qué encontrarás aquí

**Si tienes un caso delante, empieza por [[rutas/index|Rutas]].** Están escritas para eso.

- **[[rutas/index|Rutas]]** — 10 entradas por situación: qué valorar primero, qué está contraindicado y qué leer.
- **[[tesis/index|Tesis]]** — 16 afirmaciones transversales al corpus, con su fundamento y su alcance. Son la unidad recombinable de la wiki.
- **[[temas/index|Temas]]** — 40 síntesis por modelo, población, cuadro clínico y contexto de intervención.
- **[[conceptos/index|Conceptos]]** — 15 constructos teóricos, con lo que hoy se sostiene de cada uno.
- **[[protocolos/index|Protocolos]]** — 39 técnicas e instrumentos con procedimiento, indicaciones y contraindicaciones.
- **[[libros/index|Libros]]** — una nota por obra: de qué va, ideas clave, técnicas, para qué casos sirve y cómo citarla. Los textos completos **no** están aquí; cada nota enlaza al recurso original.
- **[[autores/index|Autores]]** — los 119 autores de la biblioteca con sus obras.
- **[[grafo|Grafo de conocimiento]]** — visor con tres modos: qué obras sostienen cada nota, qué notas aplica cada tesis y cómo se reparte el corpus por autor.

## Cómo se construye

1. La biblioteca original son 160 PDFs; 95 son digitales con texto nativo extraíble.
2. De cada libro digital se extrae el texto completo y se **destila con LLM** una nota de conocimiento revisable.
3. Las notas de tema, concepto y protocolo se componen **a partir de** las notas de libros: cada afirmación cita la obra y la página de la que procede.
4. Dos validadores fail-closed comprueban el contrato de cada nota antes de publicar (`validate_book_notes.py` y `validate_knowledge_notes.py`).

## Cómo leerla

Las notas están escritas para consulta profesional y aplican una regla constante: **lo que una obra afirma y lo que la evidencia sostiene se distinguen siempre**. Las inferencias, las cautelas y las lecturas que hoy no se sostienen van *en cursiva*. Varias tradiciones de este corpus nacieron atribuyendo a la familia el origen de trastornos que hoy se entienden como multifactoriales; cada nota afectada lo señala.

> [!warning] No es consejo clínico
> Material de consulta para profesionales. No sustituye el juicio clínico, la formación en cada modelo ni la supervisión. Las técnicas descritas incluyen sus contraindicaciones, y varias no deben aplicarse sin evaluación de riesgo previa.
