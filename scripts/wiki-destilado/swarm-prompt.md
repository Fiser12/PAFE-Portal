# Prompt template para el swarm de destilado (95 libros)

Cada item es un slug de `scripts/wiki-destilado/destilado-items.json`. El template sustituye `{{item}}` por el slug.

---

Vas a destilar un libro de psicología/terapia familiar en una nota de conocimiento para una wiki profesional (Quartz + convención OKF). Trabajas en el repo `/Users/ruben/Developer/PAFE-Portal`.

**Tu libro**: el item `{{item}}`. Busca sus datos con:
```
python3 -c "import json; print(json.dumps([i for i in json.load(open('scripts/wiki-destilado/destilado-items.json')) if i['slug']=='{{item}}'][0], ensure_ascii=False, indent=1))"
```
Ahí tienes `title`, `authors`, `portalUrl`, `sourceMd` (texto completo del libro en Markdown con marcadores `<!-- p. N -->` = página del PDF) y `notePath` (fichero que debes crear).

**Pasos obligatorios**:
1. Lee `wiki/content/okf-convention.md` entera. Es el contrato: frontmatter, Topology, edges, reglas editoriales (inferencia en cursiva, cita textual máx. una frase, `# Citations` obligatoria).
2. Lee el `sourceMd` de forma estratégica: primero el índice/sumario (grep por capítulos), luego los arranques de capítulo y las secciones clave con Read por offsets. El fichero puede ser grande; no hace falta leer cada línea, pero sí cubrir todos los capítulos para que la nota represente el libro entero, no la primera parte.
3. Escribe `notePath` (crea el directorio si hace falta) con esta estructura:
   - Frontmatter: `type: book`, `title`, `description` (una línea), `tags` (2-5, kebab-case, facetas: enfoque terapéutico / problema clínico / ciclo vital, según convención).
   - `# Topology` con `Authored by` (→ `[[autores/<slug-autor>]]`, slug = nombre con espacios por guiones) y `About` (→ 2-6 wikilinks de problemas clínicos/poblaciones/áreas, slug kebab-case; pueden no existir aún, no es error).
   - `## Ficha`: autores, enlace al recurso original (`portalUrl`), y editorial/año SOLO si constan en el texto extraído.
   - `## De qué va` (3-6 frases).
   - `## Ideas clave` (5-10 bullets, cada uno con su página PDF entre paréntesis si la conoces por los marcadores).
   - `## Técnicas y protocolos` (lista de técnicas concretas que enseña el libro, con wikilink `[[tecnica]]` si merece nota propia futura).
   - `## Para qué casos sirve` (orientación práctica para el psicólogo: problemáticas, poblaciones, contextos).
   - `# Citations`: bloques con capítulo/sección + rango de páginas PDF (de los marcadores `<!-- p. N -->`), indicando qué se tomó de cada uno.
4. Longitud objetivo: 60-150 líneas. Español. Tono profesional, sin hype. Nada de "este magnífico libro".
5. NO copies fragmentos largos del libro (copyright): síntesis con tus palabras; cita literal máximo una frase entre comillas con página.
6. Describe técnicas y protocolos como conocimiento atribuido a la obra, no como consejo clínico directo ni como instrucciones autoaplicables. Si implican autolesión/suicidio, trauma, violencia, menores, trastornos alimentarios, exposición, paradoja o riesgo médico, contextualiza la fecha y el enfoque, evita detalles operativos innecesarios y explicita evaluación de riesgo, salvaguardas, consentimiento, contraindicaciones o derivación cuando la propia fuente los contemple. No conviertas un caso histórico en una recomendación general.
7. Si incluyes resultados cuantitativos, conserva denominadores, abandonos, seguimiento, comparador/grupo de control y autoría del estudio. Formula «la obra informa...» o equivalente; no presentes una serie de casos como eficacia establecida.
8. Verifica antes de terminar: frontmatter válido (YAML correcto), wikilinks con formato `[[...]]`, y que el fichero existe y renderiza Markdown correcto.

Devuelve al final: ruta de la nota creada, nº de líneas, y los `About` y tags que declaraste.
