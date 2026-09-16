#!/usr/bin/env python3
"""Genera una nota `author` por cada destino [[autores/...]] enlazado desde las notas de libro.

Las notas de libro declaran `Authored by`; el grafo deriva la inversa, así que la nota de
autor no declara relaciones: lista sus obras para poder navegarlas. Es contenido derivado,
no destilado — se regenera cuando cambian las notas de libro.

Uso: python3 wiki/scripts/generate-author-notes.py
"""
from __future__ import annotations

import re
import pathlib
import collections

def _content_root() -> pathlib.Path:
    """Funciona tanto desde el super-repo (wiki/content) como desde el submodule (content)."""
    for cand in (pathlib.Path('wiki/content'), pathlib.Path('content')):
        if cand.is_dir():
            return cand
    raise SystemExit('no encuentro el directorio de contenido (ni wiki/content ni content)')



CONTENT = _content_root()
BOOKS = CONTENT / 'libros'
AUTHORS = CONTENT / 'autores'

AUTHOR_LINK = re.compile(r'\[\[autores/([^\]|#]+)')


def main() -> None:
    works: dict[str, list[tuple[str, str]]] = collections.defaultdict(list)
    for p in sorted(BOOKS.glob('*.md')):
        if p.stem == 'index':
            continue
        text = p.read_text(encoding='utf-8')
        title = (re.search(r'^title: (.+)$', text, re.M) or [None, p.stem])[1].strip('"')
        topo = re.search(r'^\* \*\*Authored by\*\*: (.+)$', text, re.M)
        if not topo:
            continue
        for slug in AUTHOR_LINK.findall(topo.group(1)):
            works[slug.strip()].append((title, p.stem))

    existing = {p.stem for p in AUTHORS.glob('*.md')} - {'index'}
    written = 0
    for slug, items in sorted(works.items()):
        name = slug.replace('-', ' ')
        n = len(items)
        plural = 'obra' if n == 1 else 'obras'
        body = [
            '---',
            'type: author',
            f'title: {name}',
            f'description: Autoría de {n} {plural} destiladas de la biblioteca PAFE',
            '---',
            '',
            f'## {plural.capitalize()} en la biblioteca',
            '',
        ]
        for title, stem in sorted(items):
            body.append(f'- [[libros/{stem}|{title}]]')
        body += [
            '',
            '---',
            '',
            '*Nota derivada: se genera desde los `Authored by` de las notas de libro con '
            '`wiki/scripts/generate-author-notes.py`. La autoría se verificó contra portada '
            'y créditos de cada obra al destilarla.*',
        ]
        (AUTHORS / f'{slug}.md').write_text('\n'.join(body) + '\n', encoding='utf-8')
        written += 1

    stale = existing - set(works)
    print(f'notas de autor escritas: {written}')
    if stale:
        print(f'sin respaldo en las notas de libro (revisar): {sorted(stale)}')


if __name__ == '__main__':
    main()
