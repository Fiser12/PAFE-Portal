#!/usr/bin/env python3
"""Genera los índices de conceptos/, protocolos/ y temas/ a partir de las notas."""
import json, re, pathlib, collections

def _content_root() -> pathlib.Path:
    """Funciona tanto desde el super-repo (wiki/content) como desde el submodule (content)."""
    for cand in (pathlib.Path('wiki/content'), pathlib.Path('content')):
        if cand.is_dir():
            return cand
    raise SystemExit('no encuentro el directorio de contenido (ni wiki/content ni content)')



CONTENT = _content_root()


def reference_map() -> dict[str, set[str]]:
    """destino -> notas de libro que lo enlazan, desde el `About` y el cuerpo.

    Es el contador «(N obras)» de los índices: cuántas obras del catálogo tratan ese
    destino. Se calcula aquí y no se lee de ningún fichero externo, para que el script
    sea reproducible en CI.
    """
    ref: dict[str, set[str]] = collections.defaultdict(set)
    link = re.compile(r'\[\[([^\]|#]+)')
    for p in sorted((CONTENT / 'libros').glob('*.md')):
        if p.stem == 'index':
            continue
        text = p.read_text(encoding='utf-8')
        about = re.search(r'^\* \*\*About\*\*: (.+)$', text, re.M)
        if about:
            for target in link.findall(about.group(1)):
                ref[target.strip()].add(p.stem)
        body = text.split('## Ficha', 1)[-1].split('# Citations', 1)[0]
        for target in link.findall(body):
            target = target.strip()
            if not target.startswith(('autores/', 'libros/')):
                ref[target].add(p.stem)
    return ref


ref = reference_map()

SPECS = {
    'conceptos': ('Conceptos', 'concept',
                  'Modelos, teorías y constructos del enfoque sistémico y de las tradiciones '
                  'que la biblioteca cubre. Cada nota sintetiza lo que dicen las obras que lo '
                  'tratan, con sus límites y con las lecturas que hoy no se sostienen.'),
    'protocolos': ('Protocolos', 'protocol',
                   'Técnicas y procedimientos clínicos atribuidos a obras concretas, con su '
                   'procedimiento, sus indicaciones y sus contraindicaciones. Requieren '
                   'formación y supervisión: ninguna nota es una instrucción de aplicación.'),
    'temas': ('Temas', 'topic',
              'Síntesis transversales que conectan lo que varias obras dicen sobre un modelo, '
              'una población, un cuadro clínico o un contexto de intervención. Cada afirmación '
              'lleva cita al libro del que procede.'),
    'tesis': ('Tesis', 'claim',
              'Afirmaciones transversales al corpus, cada una con su fundamento, su alcance y '
              'las notas donde se aplica. Se escriben cuando la misma tesis ha tenido que '
              'repetirse en tres o más notas: son la unidad recombinable de la wiki.'),
    'rutas': ('Rutas', 'guide',
              'Entradas por situación, no por tema: qué valorar primero, qué está '
              'contraindicado y qué leer. Escritas para el momento en que el caso ya está '
              'delante.'),
}

# agrupación editorial de los temas
GROUPS = {
    'Modelos y escuelas': ['terapia-familiar', 'terapia-breve', 'terapia-estrategica',
                           'terapia-estructural', 'terapia-narrativa',
                           'terapia-breve-centrada-en-soluciones', 'terapia-de-pareja',
                           'formacion-de-terapeutas'],
    'Poblaciones y relaciones': ['familia', 'pareja', 'parentalidad', 'infancia', 'adolescencia',
                                 'familias-reconstituidas'],
    'Cuadros y problemas': ['ansiedad', 'ataques-de-panico', 'fobias', 'depresion', 'psicosis',
                            'trastornos-alimentarios', 'trauma', 'duelo', 'adicciones',
                            'conflicto-familiar', 'conflicto-de-pareja'],
    'Violencia y protección': ['violencia-familiar', 'violencia-de-pareja', 'violencia-de-genero',
                               'maltrato-infantil', 'proteccion-infantil', 'acoso-escolar'],
    'Contextos de intervención': ['trabajo-en-red', 'intervencion-escolar', 'organizaciones',
                                  'migracion'],
}


def meta(p):
    t = p.read_text(encoding='utf-8')
    return {
        'title': (re.search(r'^title: (.+)$', t, re.M) or [None, p.stem])[1],
        'desc': (re.search(r'^description: (.+)$', t, re.M) or [None, ''])[1],
        'n': len(ref.get(p.stem, [])),
    }


for folder, (title, ntype, blurb) in SPECS.items():
    d = CONTENT / folder
    notes = sorted((p for p in d.glob('*.md') if p.stem != 'index'), key=lambda p: p.stem)
    lines = [f'---\ntitle: {title}\n---\n', blurb, '']
    if folder == 'temas':
        placed = set()
        for group, slugs in GROUPS.items():
            rows = [p for s in slugs for p in notes if p.stem == s]
            if not rows:
                continue
            lines.append(f'## {group}\n')
            for p in rows:
                m = meta(p)
                placed.add(p.stem)
                cnt = f" ({m['n']} obras)" if m['n'] else ''
                lines.append(f"- **[[{folder}/{p.stem}|{m['title']}]]**{cnt} — {m['desc']}")
            lines.append('')
        rest = [p for p in notes if p.stem not in placed]
        if rest:
            lines.append('## Otros\n')
            for p in rest:
                m = meta(p)
                cnt = f" ({m['n']} obras)" if m['n'] else ''
                lines.append(f"- **[[{folder}/{p.stem}|{m['title']}]]**{cnt} — {m['desc']}")
            lines.append('')
    else:
        for p in notes:
            m = meta(p)
            cnt = f" ({m['n']} obras)" if m['n'] else ''
            lines.append(f"- **[[{folder}/{p.stem}|{m['title']}]]**{cnt} — {m['desc']}")
        lines.append('')
    lines.append(f'---\n\n*{len(notes)} notas de tipo `{ntype}`. '
                 f'Generado con `scripts/generate-topology-index.py`.*')
    (d / 'index.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'{folder}/index.md — {len(notes)} notas')
