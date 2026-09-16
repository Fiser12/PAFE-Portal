#!/usr/bin/env python3
"""Regenera wiki/content/libros/index.md y wiki/content/autores/index.md.

Ejecutar desde la raíz del repo: python3 wiki/scripts/generate-indexes.py
Entradas: export/data/db-files.json (volcado de la colección `files` de producción)
          export/data/pdf-text-classification.json (clasificación digital/escaneado)
          scripts/wiki-destilado/destilado-items.json (título y autoría verificados)

El manifiesto de destilado tiene prioridad sobre `db-files.json` en título y autoría:
sus datos se comprobaron contra la portada y los créditos de cada obra al redactar las
notas, y corrigen erratas del catálogo de producción. Las divergencias se imprimen al
final para poder propagarlas al portal.
"""
import json, re, unicodedata, urllib.parse
from collections import defaultdict, Counter

db = json.load(open("export/data/db-files.json"))
cls = {p["file"]: p for p in json.load(open("export/data/pdf-text-classification.json"))["pdfs"]}
items = json.load(open("scripts/wiki-destilado/destilado-items.json"))

def clean_title(t):
    return re.sub(r"\.pdf$", "", t, flags=re.I).strip()

def slugify(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[^A-Za-z0-9áéíóúÁÉÍÓÚñÑüÜ ()_,.-]+", "", s).strip()
    return re.sub(r"\s+", "-", s)[:120]

def filename_of(portal_url):
    return urllib.parse.unquote(urllib.parse.urlparse(portal_url).path.rsplit("/", 1)[-1])

# El emparejamiento va por filename (título + hash de contenido), no por título:
# el título del portal es justamente lo que el destilado corrige, y derivar de él
# el slug rompería los wikilinks en cuanto se propaguen las correcciones.
manifest = {filename_of(i["portalUrl"]): i for i in items}

books, authors = [], defaultdict(list)
corrections = []
for r in db:
    title = clean_title(r["title"])
    kind = cls.get(r["filename"], {}).get("kind", "unknown")
    db_authors = r["categories"]
    item = manifest.get(r["filename"])
    if item:
        # el destilado verificó portada y créditos: su ficha manda
        if item["title"] != title or sorted(item["authors"]) != sorted(db_authors):
            corrections.append((item["slug"], title, db_authors, item["title"], item["authors"]))
        # el slug del manifiesto es el que existe como fichero en content/libros
        slug, title, db_authors = item["slug"], item["title"], item["authors"]
    else:
        slug = slugify(title)
    books.append({"title": title, "kind": kind, "slug": slug, "authors": db_authors})
    for a in db_authors:
        authors[a].append((title, slug, kind))

order = {"digital": 0, "mixed": 1, "scan-ocr": 2, "scan": 3, "unknown": 4}
books.sort(key=lambda b: (order.get(b["kind"], 9), b["title"].lower()))

KIND_LABEL = {"digital": "", "mixed": " _(parcialmente escaneado)_",
              "scan-ocr": " _(escaneado, OCR)_", "scan": " _(escaneado)_", "unknown": ""}

lines = ["---", "title: Libros", "---", "",
"Notas de conocimiento destiladas de cada obra de la biblioteca. Cada nota resume lo útil",
"para la práctica y enlaza al recurso original; el texto completo del libro no se reproduce aquí.",
"",
"Las obras **disponibles** son PDFs digitales con texto nativo: su nota de conocimiento se",
"generará a partir del texto completo. Las marcadas como escaneadas solo se citan de momento.",
""]
cur = None
for b in books:
    if b["kind"] != cur:
        cur = b["kind"]
        heading = {"digital": "## Disponibles para destilar",
                   "mixed": "## Parcialmente escaneadas",
                   "scan-ocr": "## Escaneadas con capa OCR",
                   "scan": "## Escaneadas (solo cita)"}.get(cur, "## Otras")
        lines += ["", heading, ""]
    auth = f" — {', '.join(b['authors'])}" if b["authors"] else ""
    lines.append(f"- [[libros/{b['slug']}|{b['title']}]]{auth}{KIND_LABEL.get(b['kind'], '')}")
open("wiki/content/libros/index.md", "w").write("\n".join(lines) + "\n")

al = ["---", "title: Autores", "---", "",
      "Autores de la biblioteca, con sus obras. Los enlaces llevan a la nota de cada libro.", ""]
for a in sorted(authors, key=lambda x: x.lower()):
    al += ["", f"## {a}", ""]
    for title, slug, kind in sorted(authors[a]):
        al.append(f"- [[libros/{slug}|{title}]]{KIND_LABEL.get(kind, '')}")
open("wiki/content/autores/index.md", "w").write("\n".join(al) + "\n")

print(Counter(b["kind"] for b in books))
print("autores:", len(authors))

if corrections:
    print(f"\n{len(corrections)} fichas donde el manifiesto corrige a db-files.json "
          "(pendiente de propagar al portal):")
    for slug, t_db, a_db, t_ok, a_ok in corrections:
        if t_db != t_ok:
            print(f"  {slug}\n    título db: {t_db}\n    título ok: {t_ok}")
        if sorted(a_db) != sorted(a_ok):
            print(f"  {slug}\n    autoría db: {a_db}\n    autoría ok: {a_ok}")
