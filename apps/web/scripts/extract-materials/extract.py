#!/usr/bin/env python3
"""Extrae los materiales PAFE (xlsx, docx→txt, pdf) a JSON para el seed.

Requiere: pip install pypdf; los DOCX convertidos a txt con `textutil -convert txt`
(fichas-libros.txt y catalogo-programas.txt junto a este script).

Salida: data/libros.json, data/juegos.json, data/programas.json, data/cortos.json
Reglas: no se inventa contenido (solo texto presente en las fuentes);
se excluyen las notas internas de valoración (contienen datos sensibles).
"""

import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET
import zipfile

MAT = Path("/Users/ruben/Developer/PAFE-Portal/Materiales PAFE")
SCRATCH = Path(__file__).parent
OUT = SCRATCH.parent.parent / "src" / "seed" / "data"
OUT.mkdir(exist_ok=True)

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


# ---------------------------------------------------------------- taxonomías
TEMATICAS = {
    "emociones-y-regulacion": "Emociones y regulación",
    "trauma-apego-y-vinculo": "Trauma, apego y vínculo",
    "acogimiento-y-adopcion": "Acogimiento y adopción",
    "educacion-afectivo-sexual": "Educación afectivo-sexual",
    "convivencia-y-relaciones": "Convivencia y relaciones",
    "desarrollo-y-aprendizaje": "Desarrollo y aprendizaje",
    "salud-y-habitos": "Salud y hábitos",
    "identidad-y-autoestima": "Identidad y autoestima",
    "familia-y-parentalidad": "Familia y parentalidad",
}
EDADES = {
    "edad-0-2": ("0–2 años", 0, 2),
    "edad-3-5": ("3–5 años", 3, 5),
    "edad-6-9": ("6–9 años", 6, 9),
    "edad-10-12": ("10–12 años", 10, 12),
    "adolescentes": ("Adolescentes", 13, 17),
    "adultos": ("Adultos", 18, 120),
}
DESTINATARIOS = {
    "nna": "Chicos y chicas (NNA)",
    "familias": "Familias acogedoras",
    "profesionales": "Profesionales",
}

# palabra clave (normalizada) → temática
KEYWORDS = {
    "emociones-y-regulacion": [
        "emocion", "identificacion emocional", "autorregulacion", "regulacion",
        "ansiedad", "miedo", "tristeza", "ira", "rabia", "celos", "envidia",
        "negativismo", "toc", "manias", "inteligencia emocional", "mindfulness",
        "calma", "enfado", "alegria", "frustracion", "bienestar", "equilibrio",
        "soledad", "preocupa", "nostalgia", "externalizante", "internalizante",
        "esperanza",
    ],
    "trauma-apego-y-vinculo": [
        "trauma", "apego", "disociacion", "vinculo", "vinculacion", "resiliencia",
        "seguridad", "pertenencia", "cuidado", "proteccion", "apoyo", "perdida",
        "duelo", "confianza", "amor",
    ],
    "acogimiento-y-adopcion": [
        "acogimiento", "adopcion", "acogedor", "beroa", "historia de vida",
        "conflicto de lealtades",
    ],
    "educacion-afectivo-sexual": [
        "educacion sexual", "sexualidad", "abuso sexual", "vulva", "pene",
        "semen", "regla", "cuerpo",
    ],
    "convivencia-y-relaciones": [
        "bullying", "acoso", "habilidades sociales", "hhss", "empatia",
        "cooperacion", "socializacion", "competencia social", "inclusion",
        "igualdad", "estereotipo", "violencia de genero", "solidaridad",
        "respeto", "amistad", "comunicacion", "convivencia", "prejuicio",
        "comprension", "aceptacion", "ayuda", "trabajo en equipo",
        "juego cooperativo", "compartir", "generosidad", "tolerancia",
        "compañerismo", "companerismo", "asercion", "conciencia social",
        "diversidad", "conducta", "comportamiento", "honestidad", "amabilidad",
        "gratitud", "humor", "conductual", "integracion", "migracion",
        "humildad", "egoismo", "paciencia", "colaboracion", "justicia",
        "unidad", "responsabilidad", "conciencia", "altruismo",
    ],
    "desarrollo-y-aprendizaje": [
        "funciones ejecutivas", "atencion", "memoria", "concentracion",
        "lenguaje", "lectoescritura", "lectura", "dislexia", "logica",
        "pensamiento logico", "desarrollo evolutivo", "desarrollo infantil",
        "psicologia evolutiva", "necesidades especiales", "motricidad",
        "psicomotricidad", "aprendizaje", "estimulacion", "velocidad",
        "observacion", "estrategia", "azar", "creatividad", "juego simbolico",
        "vision espacial", "coordinacion", "vocabulario", "categorizacion",
        "matematica", "planificacion", "reflejos", "destreza", "habilidad",
        "agudeza visual", "anticipacion", "intuicion", "tactica", "memorizar",
        "secuencia", "colores", "formas", "sensorial", "tacto", "mimica",
        "no verbal", "neuropsicolog", "cognitiv", "autoinstrucciones",
        "fonologica", "curriculo", "puzzle", "construccion", "esfuerzo",
        "perseverancia", "superacion", "imaginacion", "creativ",
    ],
    "salud-y-habitos": [
        "salud mental", "psicoeducacion", "alimentacion", "trastornos alimenticios",
        "tca", "sueno", "dormir", "higiene", "habitos", "autonomia",
        "drogas", "drogodependencia", "consumo", "adiccion", "nuevas tecnologias",
        "internet", "movil", "videojuegos", "pantallas", "autocuidado",
        "enfermedad mental", "prevencion", "salud", "psicoeducat",
        "consumismo", "deteccion",
    ],
    "identidad-y-autoestima": [
        "autoestima", "identidad", "autoconocimiento", "personalidad",
        "adolescencia", "alta sensibilidad", "libertad", "autoconcepto",
        "autoaceptacion", "aceptacion corporal", "timidez", "genero",
        "autenticidad", "valentia", "seguridad en uno mismo", "apariencia",
        "eleccion", "crecimiento", "empoderamiento", "autoconfianza", "cambio",
    ],
    "familia-y-parentalidad": [
        "familia", "parental", "competencias parentales", "cuidadores",
        "pareja", "estres y apoyo", "crianza", "padres", "abuelos",
        "intergeneracional",
    ],
}

UNMAPPED: dict[str, int] = {}


def norm_language(s: str) -> str | None:
    t = norm(s or "")
    eu = "euskera" in t or "euskara" in t
    es = "castellano" in t or "espanol" in t
    if eu and es:
        return "bilingue"
    if eu:
        return "euskera"
    if es:
        return "castellano"
    return None


def map_tematicas(*texts: str) -> list[str]:
    """Mapea texto(s) de categorías/temas/objetivos a slugs de temática."""
    joined = norm(" . ".join(t for t in texts if t))
    found: list[str] = []
    for slug, words in KEYWORDS.items():
        if any(w in joined for w in words):
            found.append(slug)
    if not found and joined:
        UNMAPPED[joined[:80]] = UNMAPPED.get(joined[:80], 0) + 1
    return found


def map_edades(text: str) -> list[str]:
    if not text:
        return []
    t = norm(text)
    tags: set[str] = set()
    if "adult" in t:
        tags.add("adultos")
    if "adolescen" in t or "joven" in t:
        tags.add("adolescentes")
    if "infancia" in t or "infantil" in t:
        tags.update(["edad-3-5", "edad-6-9", "edad-10-12"])
    if "cualquier edad" in t or "todas" in t:
        tags.update(["edad-3-5", "edad-6-9", "edad-10-12", "adolescentes"])
    if "mes" in t:  # "a partir de 12 meses"
        tags.add("edad-0-2")
    lo = hi = None
    m = re.search(r"(\d+)\s*[–\-a]\s*(\d+)", t)  # "6-12", "de 6 a 12"
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
    else:
        m = re.search(r"(?:a partir de|mayores de|desde)\s*(?:los\s*)?(\d+)", t)
        if m:
            lo, hi = int(m.group(1)), 17
    if lo is not None:
        if hi >= 90:  # "5-99": juguete "para todos" → tramos NNA
            hi = 17
        if lo >= 18:
            tags.add("adultos")
        for slug, (_, a, b) in EDADES.items():
            if lo <= b and hi >= a:
                tags.add(slug)
    return sorted(tags)


def map_perfil(text: str) -> list[str]:
    t = norm(text or "")
    tags = []
    if "chico" in t or "nna" in t or "menor" in t or "individual" in t:
        tags.append("nna")
    if "familiar" in t or "familia" in t or "acogedor" in t:
        tags.append("familias")
    if "profesional" in t:
        tags.append("profesionales")
    return tags


# ---------------------------------------------------------------- xlsx
def read_sheet(z: zipfile.ZipFile, shared: list[str], target: str) -> list[list[str]]:
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.get("Id"): r.get("Target") for r in rels}
    for s in wb.find("m:sheets", NS):
        if s.get("name") == target:
            tgt = relmap[s.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
            if not tgt.startswith("xl/"):
                tgt = "xl/" + tgt
            root = ET.fromstring(z.read(tgt))
            rows = []
            for row in root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
                vals: dict[int, str] = {}
                for c in row.findall("m:c", NS):
                    ref = c.get("r")
                    col = 0
                    for ch in re.match(r"[A-Z]+", ref).group():
                        col = col * 26 + ord(ch) - 64
                    v = c.find("m:v", NS)
                    val = ""
                    if v is not None:
                        val = v.text or ""
                        if c.get("t") == "s":
                            val = shared[int(val)]
                    vals[col - 1] = val.strip()
                width = max(vals) + 1 if vals else 0
                rows.append([vals.get(i, "") for i in range(width)])
            return rows
    raise KeyError(target)


def load_xlsx():
    z = zipfile.ZipFile(MAT / "JUEGOS.xlsx")
    shared = []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in root.findall("m:si", NS):
        shared.append("".join(t.text or "" for t in si.iter(T)))
    return z, shared


# ---------------------------------------------------------------- fichas DOCX
FICHA_LABELS = [
    "TÍTULO DEL MATERIAL", "AUTOR", "CATEGORÍA DE CONTENIDO", "CATEGORÍA",
    "CONTENIDO", "PERFIL AL QUE VA DIRIGIDO", "EDADES A LAS QUE PUEDE IR DIRIGIDO",
    "EXPLICACIÓN O GUÍA DE CÓMO USARLO", "CANTIDAD DISPONIBLE", "IDIOMA",
    "DISPONIBILIDAD", "RESERVADO POR", "FECHA DE RESERVA", "MATERIAL DE DESCARGA",
]


def parse_fichas_libros(txt: str) -> list[dict]:
    blocks = re.split(r"═+\s*", txt)
    # re-agrupar: tras el split quedan "FICHA nnn" y el cuerpo alternados
    fichas = []
    cur = None
    for b in blocks:
        b = b.strip()
        if not b:
            continue
        m = re.match(r"FICHA\s+(\d+)$", b)
        if m:
            cur = {"num": int(m.group(1)), "body": ""}
            fichas.append(cur)
        elif cur is not None:
            cur["body"] += b + "\n"
    out = []
    for f in fichas:
        # limpiar artefacto de IA
        lines = [
            ln.rstrip() for ln in f["body"].splitlines()
            if ln.strip() and "Mil disculpas" not in ln and "toda la razón" not in ln
        ]
        fields: dict[str, str] = {}
        i = 0
        while i < len(lines):
            line = lines[i]
            matched = None
            for lab in FICHA_LABELS:
                if line.upper().startswith(lab):
                    matched = lab
                    break
            if matched:
                rest = line[len(matched):].strip()
                if rest:
                    fields[matched] = rest
                    i += 1
                else:
                    # formato B: valor en las líneas siguientes hasta la próxima label
                    vals = []
                    i += 1
                    while i < len(lines) and not any(
                        lines[i].upper().startswith(l2) for l2 in FICHA_LABELS
                    ):
                        vals.append(lines[i].strip())
                        i += 1
                    fields[matched] = " ".join(vals).strip()
            else:
                i += 1
        if "TÍTULO DEL MATERIAL" in fields:
            out.append({"num": f["num"], **fields})
    return out


# ---------------------------------------------------------------- programas DOCX
PROG_LABELS = [
    ("titulo", r"T[íi]tulo del material:?\s*"),
    ("cat_contenido", r"Categor[íi]a de contenido:?\s*"),
    ("categoria", r"Categor[íi]a:\s*"),
    ("contenido", r"Contenido:?\s*"),
    ("perfil", r"Perfil al que va dirigido:?\s*"),
    ("edades", r"Edades a las que puede ir dirigido(?: en caso de CHICOS/AS)?:?\s*"),
    ("guia", r"(?:Explicaci[óo]n o gu[íi]a de c[óo]mo usarlo|Gu[íi]a de uso):?\s*"),
    ("cantidad", r"Cantidad disponible:?\s*"),
    ("descarga", r"Material de descarga:?\s*"),
]


def parse_programas_docx(txt: str) -> list[dict]:
    lines = txt.splitlines()
    fichas = []
    cur = None
    field = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if re.match(r"^(RESERVA|Usuario que reserva|Fecha reserva)$", line):
            field = None
            continue
        matched = False
        for key, pat in PROG_LABELS:
            m = re.match(pat, line, re.IGNORECASE)
            if m and (key == "titulo" or cur is not None):
                if key == "titulo":
                    cur = {}
                    fichas.append(cur)
                val = line[m.end():].strip()
                cur[key] = val
                field = key
                matched = True
                break
        if not matched and cur is not None and field:
            cur[field] = (cur[field] + " " + line).strip()
    return [f for f in fichas if f.get("titulo")]


# ---------------------------------------------------------------- PDF cortos
def parse_cortos() -> list[dict]:
    from pypdf import PdfReader

    r = PdfReader(MAT / "01-26-90 Cortom educar valores-MNM-7Ene.pdf")
    cortos = []
    for idx in range(1, len(r.pages)):
        p = r.pages[idx]
        text = p.extract_text() or ""
        url = None
        if "/Annots" in p:
            for a in p["/Annots"]:
                o = a.get_object()
                if "/A" in o and "/URI" in o["/A"]:
                    url = str(o["/A"]["/URI"])
        minutos = None
        m = re.search(r"(\d+)\s*minutos?", text)
        if m:
            minutos = int(m.group(1))
        # valores: runs de palabras TODO-MAYÚSCULAS al inicio de línea
        valores = []
        for ln in text.splitlines():
            ln = ln.strip()
            if not ln or "minuto" in ln.lower():
                continue
            mm = re.match(r"([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]{2,})(?=$|[a-z¿¡\"“])", ln)
            if mm:
                cand = mm.group(1).strip()
                # descartar si es el arranque de una frase normal
                if len(cand) >= 4 and cand == cand.upper():
                    for word in re.split(r"\s{2,}", cand):
                        w = word.strip()
                        if len(w) >= 4:
                            valores.append(w)
        # sinopsis: bloque contiguo de líneas mixtas que precede a "N minutos"
        sin_lines = []
        for ln in text.splitlines():
            s = ln.strip()
            if re.match(r"^\d+\s*minutos?$", s):
                break
            if not s or s.startswith("http"):
                continue
            if s == s.upper() and len(s) > 3:  # línea de valores
                continue
            sin_lines.append(s)
        sinopsis = re.sub(r"\s+", " ", " ".join(sin_lines)).strip()
        cortos.append({
            "page": idx + 1,
            "title": None,  # se rellena con la pasada visual
            "duration": minutos,
            "url": url,
            "valores": valores,
            "description": sinopsis,
        })
    return cortos


# ---------------------------------------------------------------- main
def main():
    z, shared = load_xlsx()

    # ---- LIBROS (Excel) ----
    excel_libros = []
    rows = read_sheet(z, shared, "Listado libros")
    for row in rows[2:]:
        if not row or not row[0].strip():
            continue
        excel_libros.append({
            "title": row[0].strip(),
            "author": row[1].strip() if len(row) > 1 else "",
            "quantity": int(row[2]) if len(row) > 2 and row[2].isdigit() else 1,
            "tema": row[3].strip() if len(row) > 3 else "",
            "idioma": row[4].strip() if len(row) > 4 else "",
        })

    fichas_txt = (SCRATCH / "fichas-libros.txt").read_text()
    fichas = parse_fichas_libros(fichas_txt)

    # match fichas ↔ excel por título normalizado
    def best_match(title: str, pool: list[str]) -> str | None:
        nt = norm(title)
        best, score = None, 0.0
        for cand in pool:
            r_ = difflib.SequenceMatcher(None, nt, norm(cand)).ratio()
            if norm(cand).startswith(nt[:25]) or nt.startswith(norm(cand)[:25]):
                r_ = max(r_, 0.9)
            if r_ > score:
                best, score = cand, r_
        return best if score >= 0.72 else None

    excel_by_title = {e["title"]: e for e in excel_libros}
    libros = []
    used_excel: set[str] = set()
    for f in fichas:
        title = f["TÍTULO DEL MATERIAL"].strip()
        ex = best_match(title, list(excel_by_title))
        exd = excel_by_title.get(ex) if ex else None
        if ex:
            used_excel.add(ex)
        cat_formato = (f.get("CATEGORÍA") or "").strip().upper()
        tipo = "programa" if cat_formato == "PROGRAMA" else "libro"
        idioma = norm_language(f.get("IDIOMA") or (exd or {}).get("idioma") or "")
        edades_txt = f.get("EDADES A LAS QUE PUEDE IR DIRIGIDO") or (exd or {}).get("tema") or ""
        cats = (
            map_tematicas(f.get("CATEGORÍA DE CONTENIDO", ""), (exd or {}).get("tema", ""))
            + map_edades(edades_txt)
            + map_perfil(f.get("PERFIL AL QUE VA DIRIGIDO", ""))
        )
        qty = None
        mq = re.search(r"(\d+)", f.get("CANTIDAD DISPONIBLE", ""))
        if mq:
            qty = int(mq.group(1))
        libros.append({
            "type": tipo,
            "title": title,
            "author": (f.get("AUTOR") or (exd or {}).get("author") or "").strip() or None,
            "language": idioma,
            "quantity": qty or (exd or {}).get("quantity") or 1,
            "content": [f["CONTENIDO"].strip()] if f.get("CONTENIDO") else None,
            "categories": sorted(set(cats)),
            "coverTheme": "book",
        })
    # libros del Excel sin ficha → sin content
    for e in excel_libros:
        if e["title"] in used_excel:
            continue
        cats = map_tematicas(e["tema"]) + map_edades(e["tema"])
        libros.append({
            "type": "libro",
            "title": e["title"],
            "author": e["author"] or None,
            "language": norm_language(e["idioma"]),
            "quantity": e["quantity"],
            "content": None,
            "categories": sorted(set(cats)),
            "coverTheme": "book",
        })

    # ---- JUEGOS (Excel) ----
    juegos = []
    rows = read_sheet(z, shared, "Listado juegos")
    for row in rows[2:]:
        if not row or not row[0].strip():
            continue
        title = row[0].strip()
        qty = 1
        mq = re.match(r"^(.*)\((\d+)\)\s*$", title)
        if mq:
            title, qty = mq.group(1).strip(), int(mq.group(2))
        edad = row[1].strip() if len(row) > 1 else ""
        desc = row[2].strip() if len(row) > 2 else ""
        obj = row[3].strip() if len(row) > 3 else ""
        paras = []
        if desc:
            paras.append(desc if desc.endswith(".") else desc + ".")
        if obj:
            paras.append(f"Objetivo: {obj}")
        cats = map_tematicas(obj) + map_edades(edad) + ["nna"]
        juegos.append({
            "type": "juego",
            "title": title,
            "author": None,
            "language": None,
            "quantity": qty,
            "content": paras or None,
            "categories": sorted(set(cats)),
            "coverTheme": "toy",
        })

    # ---- PROGRAMAS (Excel + DOCX) ----
    prog_rows = read_sheet(z, shared, "Listado programas")
    excel_progs = []
    cur = None
    seccion_dest = ""
    for row in prog_rows[2:]:
        get = lambda i: row[i].strip() if len(row) > i else ""
        if get(0):
            seccion_dest = get(0)  # Familias / Menores
        titulo = get(3)
        if titulo:
            cur = {
                "title": titulo,
                "author": get(4),
                "componentes": [],
                "objetivo": get(7),
                "idioma": get(8),
                "dest": seccion_dest,
            }
            excel_progs.append(cur)
        if cur is not None and get(6):
            n = get(5) or "1"
            cur["componentes"].append(f"{n} × {get(6)}")

    prog_txt = (SCRATCH / "catalogo-programas.txt").read_text()
    prog_fichas = parse_programas_docx(prog_txt)
    fichas_by_title = {}
    for pf in prog_fichas:
        fichas_by_title[pf["titulo"].strip()] = pf

    programas = []
    for ep in excel_progs:
        pf = None
        ptitle = ep["title"]
        m = best_match(ptitle, list(fichas_by_title))
        if m:
            pf = fichas_by_title[m]
        paras = []
        if pf and pf.get("contenido"):
            paras.append(pf["contenido"].strip())
        elif ep["objetivo"]:
            paras.append(ep["objetivo"] if ep["objetivo"].endswith(".") else ep["objetivo"] + ".")
        if pf and pf.get("guia") and len(pf["guia"]) > 20:
            paras.append("Cómo usarlo: " + pf["guia"].strip())
        if ep["componentes"]:
            paras.append("Incluye: " + "; ".join(ep["componentes"]) + ".")
        dest = map_perfil(pf.get("perfil", "") if pf else "")
        if not dest:
            dest = ["familias"] if "famili" in norm(ep["dest"]) else ["nna"]
        dest.append("profesionales")  # instrumentos técnicos: los administra el equipo
        cats = (
            map_tematicas(
                (pf or {}).get("cat_contenido", ""), ep["objetivo"],
            )
            + map_edades((pf or {}).get("edades", ""))
            + dest
        )
        programas.append({
            "type": "programa",
            "title": ptitle,
            "author": ep["author"] or None,
            "language": norm_language(ep["idioma"]) or "castellano",
            "quantity": 1,
            "content": paras or None,
            "categories": sorted(set(cats)),
            "coverTheme": "document",
        })
    # fichas DOCX sin fila Excel (Okemos…)
    matched_titles = set()
    for ep in excel_progs:
        m = best_match(ep["title"], list(fichas_by_title))
        if m:
            matched_titles.add(m)
    for t_, pf in fichas_by_title.items():
        if t_ in matched_titles:
            continue
        paras = []
        if pf.get("contenido"):
            paras.append(pf["contenido"].strip())
        if pf.get("guia") and len(pf.get("guia", "")) > 20:
            paras.append("Cómo usarlo: " + pf["guia"].strip())
        cats = (
            map_tematicas(pf.get("cat_contenido", ""))
            + map_edades(pf.get("edades", ""))
            + (map_perfil(pf.get("perfil", "")) or ["nna"])
            + ["profesionales"]
        )
        programas.append({
            "type": "programa",
            "title": t_,
            "author": None,
            "language": "castellano",
            "quantity": 1,
            "content": paras or None,
            "categories": sorted(set(cats)),
            "coverTheme": "document",
        })

    # ---- CORTOS (PDF) ----
    titles = json.loads((SCRATCH / "cortos-titles.json").read_text())
    # p.39: el enlace no es anotación en el PDF, solo texto partido en dos líneas
    URL_FIXES = {39: "https://youtu.be/u7bVNmpt0lw"}
    cortos = []
    for c in parse_cortos():
        cats = map_tematicas(" ".join(c["valores"])) + ["nna", "familias"]
        cortos.append({
            "page": c["page"],
            "title": titles.get(str(c["page"])),
            "url": c["url"] or URL_FIXES.get(c["page"]),
            "duration": c["duration"],
            "valores": c["valores"],
            "description": c["description"],
            "categories": sorted(set(cats)),
            "coverTheme": "video",
        })

    (OUT / "libros.json").write_text(json.dumps(libros, ensure_ascii=False, indent=1))
    (OUT / "juegos.json").write_text(json.dumps(juegos, ensure_ascii=False, indent=1))
    (OUT / "programas.json").write_text(json.dumps(programas, ensure_ascii=False, indent=1))
    (OUT / "cortos.json").write_text(json.dumps(cortos, ensure_ascii=False, indent=1))

    print(f"libros: {len(libros)} (fichas {len(fichas)}, excel {len(excel_libros)})")
    print(f"juegos: {len(juegos)}")
    print(f"programas: {len(programas)} (excel {len(excel_progs)}, fichas {len(prog_fichas)})")
    print(f"cortos: {len(cortos)}")
    sin_content = [l_["title"] for l_ in libros if not l_["content"]]
    print(f"libros sin content: {len(sin_content)} → {sin_content[:8]}")
    sin_cat = [x["title"] for x in libros + juegos + programas if not any(c in TEMATICAS for c in x["categories"])]
    print(f"items sin temática: {len(sin_cat)} → {sin_cat[:10]}")
    cortos_sin_cat = [f"{c['page']}:{c['title']}" for c in cortos if not any(k in TEMATICAS for k in c["categories"])]
    print(f"cortos sin temática: {len(cortos_sin_cat)} → {cortos_sin_cat[:12]}")
    cortos_sin_titulo = [c["page"] for c in cortos if not c["title"]]
    print(f"cortos sin título: {cortos_sin_titulo}")
    if UNMAPPED:
        print("\n-- textos sin mapear --")
        for k, v in sorted(UNMAPPED.items(), key=lambda x: -x[1])[:20]:
            print(f"  {v}× {k}")

    # posibles duplicados ficha↔excel que el fuzzy no casó
    print("\n-- posibles duplicados en libros --")
    titles = [l_["title"] for l_ in libros]
    for i, a in enumerate(titles):
        for b in titles[i + 1:]:
            r_ = difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
            if r_ > 0.62:
                print(f"  {r_:.2f}  «{a}»  ↔  «{b}»")


if __name__ == "__main__":
    main()
