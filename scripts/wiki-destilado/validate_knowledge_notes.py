#!/usr/bin/env python3
"""Gate estructural de las notas de conocimiento (concept / protocol / topic / instrument).

Complementa validate_book_notes.py, que cubre las notas `book`. Falla cerrado:
cualquier incumplimiento del contrato es error y devuelve código 1.

Uso:
    python3 scripts/wiki-destilado/validate_knowledge_notes.py [ruta ...]

Sin argumentos valida conceptos/, protocolos/ y temas/ enteros.
"""
from __future__ import annotations

import re
import sys
import pathlib

CONTENT = pathlib.Path('wiki/content')
DIRS = ('conceptos', 'protocolos', 'temas', 'tesis', 'rutas')

KNOWLEDGE_TYPES = {'concept', 'protocol', 'topic', 'instrument', 'claim', 'guide'}
EDGES = {'Part of', 'Contains', 'Uses', 'Depends on', 'About', 'Cites', 'Authored by'}

# Primera h2 admitida por tipo: fija el registro de la nota desde la primera línea.
OPENERS = {
    'concept': ('## Qué es', '## En qué consiste', '## De qué trata'),
    'protocol': ('## Qué es', '## En qué consiste', '## De qué trata'),
    'instrument': ('## Qué es', '## En qué consiste', '## De qué trata'),
    'topic': ('## Qué es', '## En qué consiste', '## De qué trata'),
    'claim': ('## Qué afirma',),
    'guide': ('## Cuándo aplica',),
}

# Secciones obligatorias por tipo. Las notas de conocimiento declarativo mapean el
# corpus en "En la biblioteca"; las de procedimiento describen cómo se ejecuta; las
# afirmaciones separan fundamento, alcance y aplicación; las rutas ordenan la acción.
REQUIRED_SECTIONS = {
    'concept': ('## En la biblioteca', '## Cautelas y límites'),
    'topic': ('## En la biblioteca', '## Cautelas y límites'),
    'instrument': ('## En la biblioteca', '## Cautelas y límites'),
    'protocol': ('## Procedimiento', '## Indicaciones', '## Cautelas y límites'),
    'claim': ('## En qué se apoya', '## Alcance y límites', '## Dónde se aplica'),
    'guide': ('## Qué valorar primero', '## Qué está contraindicado', '## Qué leer'),
}

MIN_LINES, MAX_LINES = 25, 130
TAG_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
LINK_RE = re.compile(r'\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]')


def note_slugs() -> set[str]:
    """Slugs resolubles: pelados para conocimiento, con carpeta para libros/autores."""
    slugs = set()
    for p in CONTENT.rglob('*.md'):
        rel = p.relative_to(CONTENT).with_suffix('')
        slugs.add(str(rel))
        slugs.add(rel.name)
    return slugs


def frontmatter(text: str, err) -> dict:
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        err('sin frontmatter delimitado por ---')
        return {}
    fm = {}
    for line in m.group(1).split('\n'):
        if not line.strip():
            continue
        km = re.match(r'^([a-zA-Z_]+): ?(.*)$', line)
        if not km:
            err(f'línea de frontmatter no parseable: {line!r}')
            continue
        fm[km.group(1)] = km.group(2).strip()
    return fm


def check(path: pathlib.Path, slugs: set[str]) -> list[str]:
    errors: list[str] = []

    def err(msg):
        errors.append(msg)

    text = path.read_text(encoding='utf-8')
    lines = text.rstrip('\n').split('\n')
    slug = path.stem

    if not MIN_LINES <= len(lines) <= MAX_LINES:
        err(f'{len(lines)} líneas, fuera de [{MIN_LINES}, {MAX_LINES}]')

    fm = frontmatter(text, err)
    ntype = fm.get('type')
    if ntype not in KNOWLEDGE_TYPES:
        err(f'type={ntype!r} no está en {sorted(KNOWLEDGE_TYPES)}')
    for field in ('title', 'description'):
        if not fm.get(field):
            err(f'falta {field} en el frontmatter')
    if ':' in fm.get('description', '') and not fm['description'].startswith(('"', "'")):
        err('description con ":" sin comillas rompe el YAML')

    raw_tags = fm.get('tags', '')
    if not (raw_tags.startswith('[') and raw_tags.endswith(']')):
        err(f'tags debe ser lista inline [a, b]: {raw_tags!r}')
    else:
        tags = [t.strip() for t in raw_tags[1:-1].split(',') if t.strip()]
        if not 2 <= len(tags) <= 5:
            err(f'{len(tags)} tags, fuera de [2, 5]: {tags}')
        for t in tags:
            if not TAG_RE.match(t):
                err(f'tag no kebab-case ASCII: {t!r}')

    # --- estructura de secciones ---
    h1 = [ln for ln in lines if ln.startswith('# ')]
    if not h1 or h1[0] != '# Topology':
        err(f'la primera h1 debe ser "# Topology", es {h1[0] if h1 else "ninguna"!r}')
    if not h1 or h1[-1] != '# Citations':
        err(f'la última h1 debe ser "# Citations", es {h1[-1] if h1 else "ninguna"!r}')

    h2 = [ln.rstrip() for ln in lines if ln.startswith('## ')]
    openers = OPENERS.get(ntype, ())
    if openers and (not h2 or h2[0] not in openers):
        err(f'la primera h2 debe ser una de {list(openers)}, es {h2[0] if h2 else "ninguna"!r}')
    for sec in REQUIRED_SECTIONS.get(ntype, ()):
        if sec not in h2:
            err(f'falta la sección {sec!r} (obligatoria en type={ntype})')

    # --- topología ---
    topo = re.search(r'^# Topology\n(.*?)(?=^## )', text, re.M | re.S)
    cites: list[str] = []
    if not topo:
        err('sección # Topology vacía o mal cerrada')
    else:
        seen = []
        for line in topo.group(1).strip().split('\n'):
            if not line.strip():
                continue
            em = re.match(r'^\* \*\*([^*]+)\*\*: (.+)$', line)
            if not em:
                err(f'línea de topología con formato inválido: {line!r}')
                continue
            edge, targets = em.group(1), em.group(2)
            if edge not in EDGES:
                err(f'edge {edge!r} fuera del set cerrado')
            if edge in seen:
                err(f'edge {edge!r} declarado más de una vez')
            seen.append(edge)
            if edge == 'Cites':
                cites = [t for t in LINK_RE.findall(targets)]
        if not cites:
            err('sin edge Cites: toda nota de conocimiento cita al menos una obra')
        for c in cites:
            if not c.startswith('libros/'):
                err(f'Cites debe apuntar a una nota book: {c!r}')

    # --- enlaces ---
    for target in LINK_RE.findall(text):
        target = target.strip()
        if target == slug:
            err(f'autoenlace [[{target}]]')
        if target.startswith(('libros/', 'autores/')) and target not in slugs:
            err(f'enlace roto: [[{target}]]')

    # cada obra citada debe localizarse en Citations
    tail = text.split('# Citations', 1)
    if len(tail) == 2:
        for c in cites:
            if c not in tail[1]:
                err(f'{c} está en Cites pero no se localiza en # Citations')

    return errors


def main(argv: list[str]) -> int:
    if argv:
        paths = [pathlib.Path(a) for a in argv]
    else:
        paths = sorted(p for d in DIRS for p in (CONTENT / d).glob('*.md')
                       if (CONTENT / d).is_dir() and p.stem != 'index')
    if not paths:
        print('no hay notas de conocimiento que validar')
        return 0

    slugs = note_slugs()
    failed = 0
    for p in paths:
        errors = check(p, slugs)
        if errors:
            failed += 1
            print(f'\n✗ {p}')
            for e in errors:
                print(f'    {e}')
    total = len(paths)
    if failed:
        print(f'\n{failed}/{total} notas con errores')
        return 1
    print(f'{total}/{total} notas de conocimiento válidas')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
