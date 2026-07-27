#!/usr/bin/env python3
"""Fail-closed structural validator for PAFE book-note batches."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = Path(__file__).with_name("destilado-items.json")
DEFAULT_CLASSIFICATION = REPO_ROOT / "export/data/pdf-text-classification.json"
FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|\Z)", re.DOTALL)
PAGE_MARKER_RE = re.compile(r"<!-- p\. (\d+) -->")
PAGE_REFERENCE_RE = re.compile(
    r"(?<![\w])(?:pp?\.|p[aá]g(?:ina)?s?\.?)\s*(\d+)"
    r"(?:\s*(?:-|–|—|a)\s*(\d+))?",
    re.IGNORECASE,
)
WIKILINK_RE = re.compile(r"\[\[([^\[\]\n|]+)(?:\|([^\[\]\n]+))?\]\]")
TAG_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
EDGE_RE = re.compile(r"^\s*[-*]\s+\*\*([^*]+)\*\*:\s*(.*?)\s*$", re.MULTILINE)
ALLOWED_EDGES = {
    "Part of",
    "Contains",
    "Uses",
    "Depends on",
    "About",
    "Cites",
    "Authored by",
}
REQUIRED_SECTIONS = (
    "# Topology",
    "## Ficha",
    "## De qué va",
    "## Ideas clave",
    "## Técnicas y protocolos",
    "## Para qué casos sirve",
    "# Citations",
)
REQUIRED_MANIFEST_FIELDS = ("slug", "title", "authors", "portalUrl", "sourceMd", "notePath")


@dataclass
class ValidationResult:
    slug: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Valida un lote de notas de libro contra su manifiesto.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--classification", type=Path, default=DEFAULT_CLASSIFICATION)
    parser.add_argument(
        "--batch",
        metavar="START:END",
        help="Rango 1-based inclusivo del manifiesto, por ejemplo 1:20 o 21:30.",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="SLUG",
        help="Valida solo este slug; se puede repetir. No se combina con --batch.",
    )
    parser.add_argument(
        "--quartz",
        action="store_true",
        help="Si no hay errores, ejecuta `npm run quartz -- build` dentro de wiki/.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"No existe: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"JSON inválido en {path}: {exc}") from exc


def resolve_repo_path(raw_path: str) -> Path:
    path = Path(raw_path)
    return path if path.is_absolute() else REPO_ROOT / path


def load_yaml() -> tuple[Any, type[Any]]:
    try:
        import yaml  # type: ignore[import-not-found]
    except ImportError as exc:
        raise SystemExit(
            "Falta PyYAML: el validador falla de forma cerrada si no puede analizar YAML. "
            "Consulta README.md."
        ) from exc

    class UniqueKeyLoader(yaml.SafeLoader):
        pass

    def construct_mapping(loader: Any, node: Any, deep: bool = False) -> dict[Any, Any]:
        mapping: dict[Any, Any] = {}
        for key_node, value_node in node.value:
            key = loader.construct_object(key_node, deep=deep)
            if key in mapping:
                raise yaml.constructor.ConstructorError(
                    "while constructing a mapping",
                    node.start_mark,
                    f"duplicate key: {key}",
                    key_node.start_mark,
                )
            mapping[key] = loader.construct_object(value_node, deep=deep)
        return mapping

    UniqueKeyLoader.add_constructor(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        construct_mapping,
    )
    return yaml, UniqueKeyLoader


def validate_manifest(data: Any) -> tuple[list[dict[str, Any]], list[str]]:
    if not isinstance(data, list):
        return [], ["el manifiesto debe ser una lista JSON"]

    errors: list[str] = []
    items: list[dict[str, Any]] = []
    seen: dict[str, set[str]] = {"slug": set(), "sourceMd": set(), "notePath": set()}
    for index, raw in enumerate(data, 1):
        prefix = f"item {index}"
        if not isinstance(raw, dict):
            errors.append(f"{prefix}: debe ser un objeto")
            continue
        missing = [field for field in REQUIRED_MANIFEST_FIELDS if field not in raw]
        if missing:
            errors.append(f"{prefix}: faltan campos {', '.join(missing)}")
            continue
        for field in ("slug", "title", "portalUrl", "sourceMd", "notePath"):
            if not isinstance(raw[field], str) or not raw[field].strip():
                errors.append(f"{prefix}: {field} debe ser un string no vacío")
        if not isinstance(raw["authors"], list) or not all(
            isinstance(author, str) and author.strip() for author in raw["authors"]
        ):
            errors.append(f"{prefix}: authors debe ser una lista de strings no vacíos")
        if not isinstance(raw["portalUrl"], str) or not raw["portalUrl"].startswith("https://"):
            errors.append(f"{prefix}: portalUrl debe ser HTTPS")
        for field in seen:
            value = raw.get(field)
            if isinstance(value, str):
                if value in seen[field]:
                    errors.append(f"{prefix}: {field} duplicado: {value}")
                seen[field].add(value)
        items.append(raw)
    return items, errors


def select_items(
    items: list[dict[str, Any]], batch: str | None, only: list[str]
) -> list[dict[str, Any]]:
    if batch and only:
        raise SystemExit("No combines --batch y --only")
    if batch:
        match = re.fullmatch(r"(\d+):(\d+)", batch)
        if not match:
            raise SystemExit("--batch debe tener formato START:END")
        start, end = map(int, match.groups())
        if start < 1 or end < start or end > len(items):
            raise SystemExit(f"Rango fuera de 1..{len(items)}: {batch}")
        return items[start - 1 : end]
    if only:
        by_slug = {item["slug"]: item for item in items}
        missing = [slug for slug in only if slug not in by_slug]
        if missing:
            raise SystemExit("Slugs --only ausentes del manifiesto: " + ", ".join(missing))
        return [by_slug[slug] for slug in only]
    return items


def classification_by_filename(data: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(data, dict) or not isinstance(data.get("pdfs"), list):
        raise SystemExit("La clasificación debe ser un objeto con una lista `pdfs`")
    result: dict[str, dict[str, Any]] = {}
    for record in data["pdfs"]:
        if isinstance(record, dict) and isinstance(record.get("file"), str):
            result[record["file"]] = record
    return result


def pdf_filename(item: dict[str, Any]) -> str:
    return urllib.parse.unquote(urllib.parse.urlparse(item["portalUrl"]).path.rsplit("/", 1)[-1])


def parse_frontmatter(
    text: str, yaml_module: Any, loader: type[Any], result: ValidationResult
) -> dict[str, Any] | None:
    match = FRONTMATTER_RE.match(text)
    if not match:
        result.errors.append("frontmatter ausente o sin delimitadores válidos")
        return None
    try:
        frontmatter = yaml_module.load(match.group(1), Loader=loader)
    except yaml_module.YAMLError as exc:
        problem = getattr(exc, "problem", None) or str(exc).splitlines()[0]
        result.errors.append(f"YAML inválido: {problem}")
        return None
    if not isinstance(frontmatter, dict):
        result.errors.append("el frontmatter debe ser un mapping YAML")
        return None
    return frontmatter


def validate_frontmatter(
    frontmatter: dict[str, Any], item: dict[str, Any], result: ValidationResult
) -> None:
    for field in ("type", "title", "description", "tags"):
        if field not in frontmatter:
            result.errors.append(f"frontmatter: falta {field}")
    if frontmatter.get("type") != "book":
        result.errors.append(f"frontmatter: type debe ser book, no {frontmatter.get('type')!r}")
    title = frontmatter.get("title")
    if not isinstance(title, str) or not title.strip() or "\n" in title:
        result.errors.append("frontmatter: title debe ser un string no vacío de una línea")
    elif title != item["title"]:
        result.warnings.append(
            "frontmatter: title difiere del manifiesto (puede ser una corrección editorial)"
        )
    description = frontmatter.get("description")
    if not isinstance(description, str) or not description.strip() or "\n" in description:
        result.errors.append("frontmatter: description debe ser un string no vacío de una línea")
    tags = frontmatter.get("tags")
    if not isinstance(tags, list):
        result.errors.append("frontmatter: tags debe ser una lista YAML")
    else:
        if not 2 <= len(tags) <= 5:
            result.errors.append(f"frontmatter: deben existir 2-5 tags, hay {len(tags)}")
        if len(tags) != len(set(tags)):
            result.errors.append("frontmatter: hay tags duplicados")
        for tag in tags:
            if not isinstance(tag, str) or not TAG_RE.fullmatch(tag):
                result.errors.append(f"frontmatter: tag no kebab-case ASCII: {tag!r}")


def section_offsets(text: str, result: ValidationResult) -> dict[str, int]:
    offsets: dict[str, int] = {}
    previous = -1
    for heading in REQUIRED_SECTIONS:
        matches = list(re.finditer(rf"^{re.escape(heading)}\s*$", text, re.MULTILINE))
        if len(matches) != 1:
            result.errors.append(f"sección {heading!r}: esperada una vez, encontrada {len(matches)}")
            continue
        offsets[heading] = matches[0].start()
        if matches[0].start() <= previous:
            result.errors.append(f"sección fuera de orden: {heading}")
        previous = matches[0].start()
    return offsets


def validate_topology(text: str, offsets: dict[str, int], result: ValidationResult) -> None:
    if "# Topology" not in offsets or "## Ficha" not in offsets:
        return
    topology = text[offsets["# Topology"] : offsets["## Ficha"]]
    edges = EDGE_RE.findall(topology)
    labels = [label.strip() for label, _ in edges]
    for label in labels:
        if label not in ALLOWED_EDGES:
            result.errors.append(f"Topology: edge fuera del set cerrado: {label!r}")
    for required in ("Authored by", "About"):
        if labels.count(required) != 1:
            result.errors.append(
                f"Topology: {required!r} debe aparecer una vez, aparece {labels.count(required)}"
            )
    for label, targets in edges:
        links = WIKILINK_RE.findall(targets)
        if not links:
            result.errors.append(f"Topology: edge {label.strip()!r} sin wikilinks")
        if label.strip() == "About" and not 2 <= len(links) <= 6:
            result.errors.append(f"Topology: About debe tener 2-6 wikilinks, tiene {len(links)}")

    bullet_lines = [line for line in topology.splitlines()[1:] if line.lstrip().startswith(("*", "-"))]
    if len(bullet_lines) != len(edges):
        result.errors.append("Topology: hay bullets que no siguen `* **Edge**: [[destino]]`")


def validate_wikilinks(text: str, result: ValidationResult) -> None:
    residual = WIKILINK_RE.sub("", text)
    if "[[" in residual or "]]" in residual:
        result.errors.append("wikilink mal formado o delimitadores [[ ]] desequilibrados")
    for target, _label in WIKILINK_RE.findall(text):
        if not target.strip() or target != target.strip():
            result.errors.append(f"wikilink con destino vacío o espacios exteriores: {target!r}")


def validate_page_references(
    text: str, page_count: int, available_markers: set[int], result: ValidationResult
) -> None:
    for match in PAGE_REFERENCE_RE.finditer(text):
        start = int(match.group(1))
        end = int(match.group(2) or start)
        rendered = match.group(0)
        if end < start:
            result.errors.append(f"rango de páginas invertido: {rendered}")
            continue
        if start < 1 or end > page_count:
            result.errors.append(f"página fuera de 1..{page_count}: {rendered}")
            continue
        missing = [page for page in range(start, end + 1) if page not in available_markers]
        if missing:
            preview = ", ".join(map(str, missing[:5]))
            result.errors.append(f"páginas citadas sin marcador en la fuente: {preview}")


def validate_item(
    item: dict[str, Any],
    classification: dict[str, dict[str, Any]],
    yaml_module: Any,
    yaml_loader: type[Any],
) -> ValidationResult:
    result = ValidationResult(item["slug"])
    source = resolve_repo_path(item["sourceMd"])
    note = resolve_repo_path(item["notePath"])
    pdf_record = classification.get(pdf_filename(item))
    if pdf_record is None or not isinstance(pdf_record.get("pages"), int):
        result.errors.append("portalUrl no se pudo asociar a un PDF con número de páginas")
        page_count = 0
    else:
        page_count = pdf_record["pages"]

    markers: list[int] = []
    if not source.is_file():
        result.errors.append(f"sourceMd no existe: {item['sourceMd']}")
    else:
        try:
            source_text = source.read_text(encoding="utf-8")
            markers = [int(value) for value in PAGE_MARKER_RE.findall(source_text)]
        except UnicodeDecodeError:
            result.errors.append(f"sourceMd no es UTF-8: {item['sourceMd']}")
        if page_count and markers != list(range(1, page_count + 1)):
            summary = f"{markers[:3]}…{markers[-3:]}" if markers else "ninguno"
            result.errors.append(
                f"sourceMd: marcadores {summary}; se esperaba exactamente 1..{page_count}"
            )

    if not note.is_file():
        result.errors.append(f"notePath no existe: {item['notePath']}")
        return result
    try:
        text = note.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        result.errors.append(f"notePath no es UTF-8: {item['notePath']}")
        return result

    line_count = len(text.splitlines())
    if not 60 <= line_count <= 150:
        result.errors.append(f"longitud fuera de 60-150 líneas: {line_count}")
    frontmatter = parse_frontmatter(text, yaml_module, yaml_loader, result)
    if frontmatter is not None:
        validate_frontmatter(frontmatter, item, result)
    offsets = section_offsets(text, result)
    validate_topology(text, offsets, result)
    validate_wikilinks(text, result)
    if item["portalUrl"] not in text:
        result.errors.append("la nota no contiene el portalUrl exacto del manifiesto")
    if page_count:
        validate_page_references(text, page_count, set(markers), result)

    h1_headings = re.findall(r"^# [^#].*$", text, re.MULTILINE)
    if h1_headings and h1_headings[-1].strip() != "# Citations":
        result.errors.append("# Citations debe ser la última sección de nivel 1")
    return result


def main() -> int:
    args = parse_args()
    yaml_module, yaml_loader = load_yaml()
    items, manifest_errors = validate_manifest(load_json(args.manifest))
    if manifest_errors:
        print("MANIFEST FAIL", file=sys.stderr)
        for error in manifest_errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    selected = select_items(items, args.batch, args.only)
    classification = classification_by_filename(load_json(args.classification))

    results = [
        validate_item(item, classification, yaml_module, yaml_loader) for item in selected
    ]
    for result in results:
        print(f"{'PASS' if result.ok else 'FAIL'} {result.slug}")
        for error in result.errors:
            print(f"  ERROR: {error}")
        for warning in result.warnings:
            print(f"  WARN: {warning}")

    passed = sum(result.ok for result in results)
    failed = len(results) - passed
    print(f"Resultado: {passed}/{len(results)} PASS; {failed} FAIL")
    print(
        "Límite: esta validación estructural no demuestra cobertura de capítulos, "
        "exactitud clínica, fidelidad de la síntesis ni ausencia de copia semántica."
    )
    if failed:
        print("Quartz no se ejecuta mientras haya errores deterministas.")
        return 1

    quartz_command = "npm run quartz -- build"
    if args.quartz:
        completed = subprocess.run(["npm", "run", "quartz", "--", "build"], cwd=REPO_ROOT / "wiki")
        return completed.returncode
    print(f"Gate siguiente (opcional): cd wiki && {quartz_command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
