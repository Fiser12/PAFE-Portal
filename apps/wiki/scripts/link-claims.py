#!/usr/bin/env python3
"""Enlaza cada tesis (`claim`) desde las notas donde ella misma declara aplicarse.

Las notas de tesis listan sus destinos en `## Dónde se aplica`. Ese enlace solo iba en un
sentido, así que quien leía la cautela en la nota de tema no veía la tesis que la desarrolla.
Este script cierra la dirección de lectura:

1. Añade las tesis al edge `Depends on` del Topology (creándolo si no existe).
2. Añade una línea de cierre en `## Cautelas y límites` con las tesis aplicables.

Idempotente: no duplica lo que ya está. Uso: python3 wiki/scripts/link-claims.py [--apply]
"""
from __future__ import annotations

import re
import sys
import pathlib
import collections

def _content_root() -> pathlib.Path:
    """Funciona tanto desde el super-repo (wiki/content) como desde el submodule (content)."""
    for cand in (pathlib.Path('wiki/content'), pathlib.Path('content')):
        if cand.is_dir():
            return cand
    raise SystemExit('no encuentro el directorio de contenido (ni wiki/content ni content)')



CONTENT = _content_root()
KNOWLEDGE_DIRS = ('conceptos', 'protocolos', 'temas')
MARK = '**Tesis aplicables**:'


def note_index() -> dict[str, pathlib.Path]:
    return {p.stem: p for d in KNOWLEDGE_DIRS for p in (CONTENT / d).glob('*.md')
            if p.stem != 'index'}


def claim_titles() -> dict[str, str]:
    out = {}
    for p in (CONTENT / 'tesis').glob('*.md'):
        if p.stem == 'index':
            continue
        m = re.search(r'^title: (.+)$', p.read_text(encoding='utf-8'), re.M)
        out[p.stem] = m.group(1) if m else p.stem
    return out


def build_map(notes: dict[str, pathlib.Path]) -> dict[str, list[str]]:
    """tesis -> notas, leído de la sección que cada tesis declara."""
    mapping: dict[str, list[str]] = collections.defaultdict(list)
    for p in sorted((CONTENT / 'tesis').glob('*.md')):
        if p.stem == 'index':
            continue
        text = p.read_text(encoding='utf-8')
        sec = re.search(r'^## Dónde se aplica\n(.*?)(?=^# Citations)', text, re.M | re.S)
        if not sec:
            print(f'  !! {p.stem}: sin sección "Dónde se aplica"', file=sys.stderr)
            continue
        for target in dict.fromkeys(t.strip() for t in re.findall(r'\[\[([^\]|#]+)', sec.group(1))):
            if target in notes:
                mapping[target].append(p.stem)
    return mapping


def add_depends_on(text: str, claims: list[str]) -> str:
    """Añade las tesis al edge `Depends on`, o lo crea antes de `Cites`."""
    topo = re.search(r'^# Topology\n(.*?)(?=^## )', text, re.M | re.S)
    if not topo:
        return text
    block = topo.group(1)
    missing = [c for c in claims if f'[[{c}]]' not in block]
    if not missing:
        return text
    links = ', '.join(f'[[{c}]]' for c in missing)
    dep = re.search(r'^(\* \*\*Depends on\*\*: )(.+)$', block, re.M)
    if dep:
        new_block = block.replace(dep.group(0), f'{dep.group(1)}{dep.group(2)}, {links}')
    else:
        cites = re.search(r'^\* \*\*Cites\*\*: .+$', block, re.M)
        anchor = cites.group(0) if cites else None
        if anchor:
            new_block = block.replace(anchor, f'* **Depends on**: {links}\n{anchor}')
        else:
            new_block = block.rstrip('\n') + f'\n* **Depends on**: {links}\n\n'
    return text.replace(block, new_block, 1)


def add_closing_line(text: str, claims: list[str], titles: dict[str, str]) -> str:
    """Añade la línea de tesis aplicables al final de `## Cautelas y límites`."""
    if MARK in text:
        return text
    links = ', '.join(f'[[{c}|{titles[c].lower()}]]' for c in claims)
    line = f'\n{MARK} {links}.\n'
    m = re.search(r'^## Cautelas y límites\n(.*?)(?=^# Citations)', text, re.M | re.S)
    if not m:
        return text
    body = m.group(1)
    return text.replace(body, body.rstrip('\n') + '\n' + line, 1)


def main(argv: list[str]) -> int:
    apply = '--apply' in argv
    notes = note_index()
    titles = claim_titles()
    mapping = build_map(notes)

    changed = 0
    for slug, claims in sorted(mapping.items()):
        p = notes[slug]
        original = p.read_text(encoding='utf-8')
        text = add_depends_on(original, sorted(claims))
        text = add_closing_line(text, sorted(claims), titles)
        if text != original:
            changed += 1
            if apply:
                p.write_text(text, encoding='utf-8')
    orphans = sorted(set(notes) - set(mapping))
    verb = 'modificadas' if apply else 'se modificarían'
    print(f'{verb}: {changed} notas de {len(notes)}')
    print(f'pares tesis-nota: {sum(len(v) for v in mapping.values())}')
    if orphans:
        print(f'\nsin ninguna tesis aplicable ({len(orphans)}):')
        print('  ' + ', '.join(orphans))
    if not apply:
        print('\n(dry-run: repite con --apply para escribir)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
