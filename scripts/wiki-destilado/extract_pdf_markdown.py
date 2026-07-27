#!/usr/bin/env python3
"""Extract digital PDFs to page-delimited Markdown reproducibly.

The extractor is intentionally independent from the application runtime. It writes
each Markdown file atomically and records enough provenance in a sidecar to skip an
unchanged, already validated extraction safely on the next run.

Algunos PDF incrustan fuentes sin un mapa a Unicode utilizable: pymupdf4llm devuelve
entonces texto compuesto casi por completo de U+FFFD, sintácticamente válido pero
ilegible. Ocurrió con dos libros del catálogo y no se detectó hasta intentar
destilarlos. Por eso la extracción se verifica y, si sale ilegible, se reintenta con
poppler (`pdftotext`), que sí resuelve esos casos. El sidecar registra qué motor
produjo cada salida.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CLASSIFICATION = REPO_ROOT / "export/data/pdf-text-classification.json"
DEFAULT_MANIFEST = Path(__file__).with_name("destilado-items.json")
DEFAULT_PDF_DIR = REPO_ROOT / "export/r2/files"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "export/text/r2-files-md"
# 2: verificación de legibilidad y reintento con poppler
EXTRACTOR_VERSION = 2
HASH_CHUNK_SIZE = 1024 * 1024
REPLACEMENT_CHAR = "�"
# Por encima de esta fracción de U+FFFD el texto no sirve para destilar. Un 2 % deja
# margen para PDF con algún glifo suelto sin mapear.
MAX_REPLACEMENT_RATIO = 0.02
PAGE_MARKER_RE = re.compile(r"<!-- p\. (\d+) -->")
PDF_HASH_SUFFIX_RE = re.compile(r"-[0-9a-f]{40}\.pdf$", re.IGNORECASE)
SAFE_STEM_RE = re.compile(r"[^A-Za-z0-9áéíóúÁÉÍÓÚñÑüÜ ()_,.\-]+")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extrae los PDF digitales a Markdown con marcadores de página 1..N."
    )
    parser.add_argument("--classification", type=Path, default=DEFAULT_CLASSIFICATION)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--pdf-dir", type=Path, default=DEFAULT_PDF_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="SELECTOR",
        help=(
            "Procesa solo un slug del manifiesto, nombre de PDF o stem de salida. "
            "Se puede repetir."
        ),
    )
    parser.add_argument(
        "--resume",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Omite una salida solo si su sidecar, hash y páginas siguen siendo válidos.",
    )
    parser.add_argument("--force", action="store_true", help="Reextrae aunque la salida sea válida.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra qué se extraería u omitiría sin importar pymupdf4llm ni escribir.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"No existe: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"JSON inválido en {path}: {exc}") from exc


def output_stem(pdf_name: str) -> str:
    stem = PDF_HASH_SUFFIX_RE.sub("", pdf_name)
    return SAFE_STEM_RE.sub("", stem).strip()[:120]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(HASH_CHUNK_SIZE), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sidecar_path(destination: Path) -> Path:
    return destination.with_suffix(destination.suffix + ".extract.json")


def page_markers(path: Path) -> list[int]:
    try:
        return [int(value) for value in PAGE_MARKER_RE.findall(path.read_text(encoding="utf-8"))]
    except (FileNotFoundError, UnicodeDecodeError):
        return []


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temporary = Path(handle.name)
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    atomic_write_text(path, json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


def load_manifest_selectors(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    data = load_json(path)
    if not isinstance(data, list):
        raise SystemExit(f"El manifiesto debe ser una lista: {path}")
    selectors: dict[str, str] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        slug = item.get("slug")
        source_md = item.get("sourceMd")
        if isinstance(slug, str) and isinstance(source_md, str):
            selectors[slug] = Path(source_md).stem
    return selectors


def select_targets(
    records: list[dict[str, Any]], requested: list[str], manifest_selectors: dict[str, str]
) -> list[dict[str, Any]]:
    if not requested:
        return records

    expanded = {manifest_selectors.get(selector, selector) for selector in requested}
    selected: list[dict[str, Any]] = []
    matched: set[str] = set()
    for record in records:
        pdf_name = record["file"]
        stem = output_stem(pdf_name)
        aliases = {pdf_name, Path(pdf_name).stem, stem}
        hits = expanded.intersection(aliases)
        if hits:
            selected.append(record)
            matched.update(hits)

    missing = sorted(expanded - matched)
    if missing:
        raise SystemExit("Selectores --only sin coincidencia: " + ", ".join(missing))
    return selected


def valid_resume(
    source: Path,
    destination: Path,
    expected_pages: int,
    source_sha256: str | None = None,
) -> bool:
    metadata_path = sidecar_path(destination)
    if not destination.is_file() or not metadata_path.is_file():
        return False
    try:
        metadata = load_json(metadata_path)
    except SystemExit:
        return False
    if not isinstance(metadata, dict):
        return False
    if metadata.get("extractorVersion") != EXTRACTOR_VERSION:
        return False
    if metadata.get("sourceFile") != source.name or metadata.get("pageCount") != expected_pages:
        return False
    if metadata.get("sourceSize") != source.stat().st_size:
        return False
    if page_markers(destination) != list(range(1, expected_pages + 1)):
        return False
    if metadata.get("outputSha256") != sha256_file(destination):
        return False
    expected_source_hash = source_sha256 or sha256_file(source)
    return metadata.get("sourceSha256") == expected_source_hash


def replacement_ratio(text: str) -> float:
    """Fracción de caracteres de reemplazo: mide si el texto es legible."""
    if not text:
        return 1.0
    return text.count(REPLACEMENT_CHAR) / len(text)


def extract_with_poppler(source: Path, expected_pages: int) -> str:
    """Reintento con `pdftotext`, que resuelve las fuentes sin mapa Unicode."""
    if shutil.which("pdftotext") is None:
        raise ValueError(
            "extracción ilegible y pdftotext no está disponible para reintentarla; "
            "instala poppler (consulta README.md)"
        )
    completed = subprocess.run(
        ["pdftotext", "-layout", "-enc", "UTF-8", str(source), "-"],
        capture_output=True,
        check=True,
    )
    raw = completed.stdout.decode("utf-8", errors="replace")
    pages = raw.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected_pages:
        raise ValueError(
            f"pdftotext devolvió {len(pages)} páginas (esperadas {expected_pages})"
        )
    parts = [f"<!-- p. {number} -->\n\n{body.rstrip()}" for number, body in enumerate(pages, 1)]
    return "\n\n".join(parts) + "\n"


def extract_one(
    pymupdf4llm: Any,
    source: Path,
    destination: Path,
    expected_pages: int,
    source_sha256: str,
) -> None:
    chunks = pymupdf4llm.to_markdown(str(source), use_ocr=False, page_chunks=True)
    pages: list[int] = []
    parts: list[str] = []
    for chunk in chunks:
        page = chunk.get("metadata", {}).get("page_number")
        if not isinstance(page, int):
            raise ValueError("pymupdf4llm no devolvió page_number entero")
        pages.append(page)
        parts.append(f"<!-- p. {page} -->\n\n{chunk.get('text', '').strip()}")

    expected_sequence = list(range(1, expected_pages + 1))
    if pages != expected_sequence:
        raise ValueError(
            f"secuencia de páginas inesperada: {pages[:3]}…{pages[-3:]} "
            f"(esperada 1..{expected_pages})"
        )

    content = "\n\n".join(parts) + "\n"
    engine = "pymupdf4llm"
    ratio = replacement_ratio(content)
    if ratio > MAX_REPLACEMENT_RATIO:
        fallback = extract_with_poppler(source, expected_pages)
        fallback_ratio = replacement_ratio(fallback)
        if fallback_ratio >= ratio:
            raise ValueError(
                f"texto ilegible con ambos motores ({ratio:.1%} de caracteres de "
                f"reemplazo con pymupdf4llm, {fallback_ratio:.1%} con pdftotext); "
                "el PDF necesita OCR"
            )
        print(
            f"      fuente sin mapa Unicode ({ratio:.1%} ilegible): "
            f"reextraído con pdftotext ({fallback_ratio:.1%})"
        )
        content, engine, ratio = fallback, "pdftotext", fallback_ratio

    atomic_write_text(destination, content)
    metadata = {
        "extractorVersion": EXTRACTOR_VERSION,
        "sourceFile": source.name,
        "sourceSha256": source_sha256,
        "sourceSize": source.stat().st_size,
        "pageCount": expected_pages,
        "outputSha256": sha256_file(destination),
        "engine": engine,
        "replacementRatio": round(ratio, 6),
    }
    atomic_write_json(sidecar_path(destination), metadata)


def main() -> int:
    args = parse_args()
    classification = load_json(args.classification)
    if not isinstance(classification, dict) or not isinstance(classification.get("pdfs"), list):
        raise SystemExit(f"Formato de clasificación inesperado: {args.classification}")

    digital = [
        record
        for record in classification["pdfs"]
        if isinstance(record, dict) and record.get("kind") == "digital"
    ]
    for record in digital:
        if not isinstance(record.get("file"), str) or not isinstance(record.get("pages"), int):
            raise SystemExit("Cada PDF digital debe declarar file y pages")

    targets = select_targets(digital, args.only, load_manifest_selectors(args.manifest))
    if not targets:
        raise SystemExit("No hay PDF digitales seleccionados")

    if args.dry_run:
        for record in targets:
            destination = args.output_dir / f"{output_stem(record['file'])}.md"
            action = "examinar para reanudar" if args.resume and not args.force else "extraer"
            print(f"DRY-RUN {action}: {record['file']} -> {destination}")
        print(f"DRY-RUN: {len(targets)} PDF seleccionados; no se escribió nada")
        return 0

    try:
        import pymupdf4llm  # type: ignore[import-not-found]
    except ImportError as exc:
        raise SystemExit(
            "Falta pymupdf4llm. Instálalo en un entorno Python aislado; consulta README.md."
        ) from exc

    started = time.monotonic()
    extracted = skipped = failed = 0
    for index, record in enumerate(targets, 1):
        source = args.pdf_dir / record["file"]
        destination = args.output_dir / f"{output_stem(record['file'])}.md"
        if not source.is_file():
            print(f"ERROR [{index}/{len(targets)}] no existe {source}", file=sys.stderr)
            failed += 1
            continue

        try:
            source_hash: str | None = None
            if args.resume and not args.force:
                if valid_resume(source, destination, record["pages"]):
                    print(f"SKIP  [{index}/{len(targets)}] {destination.name}")
                    skipped += 1
                    continue
                source_hash = sha256_file(source)
            extract_one(
                pymupdf4llm,
                source,
                destination,
                record["pages"],
                source_hash or sha256_file(source),
            )
            print(f"OK    [{index}/{len(targets)}] {destination.name}")
            extracted += 1
        except Exception as exc:  # keep the rest of a requested batch resumable
            print(f"ERROR [{index}/{len(targets)}] {record['file']}: {exc}", file=sys.stderr)
            failed += 1

    elapsed = time.monotonic() - started
    print(
        f"Resultado: {extracted} extraídos, {skipped} omitidos, {failed} fallidos "
        f"({elapsed:.1f}s)"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
