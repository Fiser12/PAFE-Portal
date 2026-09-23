#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:?Uso: bash scripts/test-docker.sh imagen-web imagen-migrator URL-local}"
MIGRATOR_IMAGE="${2:?Falta la imagen migrator}"
BASE_URL="${3:?Falta la URL del contenedor en ejecución}"

# Regresión: un build limpio debe contener la wiki sin depender de artefactos locales.
docker run --rm --entrypoint node "$IMAGE" -e '
  const fs = require("node:fs");
  const assert = require("node:assert/strict");
  assert.ok(fs.statSync("/app/apps/web/public/wiki/index.html").size > 0);
  assert.ok(fs.statSync("/app/apps/web/public/wiki/static/contentIndex.json").size > 0);
  assert.ok(fs.statSync("/app/apps/web/server.js").size > 0);
  console.log("OK: servidor standalone y wiki incluidos");
'

# La imagen de migración contiene las fuentes; tampoco debe contener datos privados.
docker run --rm --entrypoint node "$MIGRATOR_IMAGE" -e '
  const fs = require("node:fs");
  const assert = require("node:assert/strict");
  for (const path of [".backup-r2", "export", "wiki", ".git", ".docker.env", "apps/web/.env.local", "apps/web/public/wiki"]) {
    assert.equal(fs.existsSync(`/app/${path}`), false, `No debe incluirse ${path}`);
  }
  console.log("OK: fuentes sin backups, secretos ni wiki precompilada del host");
'

for path in / /login /admin /api/auth/get-session '/api/media?limit=1&depth=0'; do
  status="$(curl --silent --show-error --max-time 30 --output /dev/null --write-out '%{http_code}' "${BASE_URL}${path}")"
  test "$status" = 200 || { echo "Fallo: ${path} devolvió HTTP ${status}" >&2; exit 1; }
done
status="$(curl --silent --show-error --max-time 30 --output /dev/null --write-out '%{http_code}' "${BASE_URL}/api/noticia?limit=1")"
test "$status" = 403 || { echo "Fallo: foro sin sesión devolvió HTTP ${status}" >&2; exit 1; }
echo 'OK: HTTP y consulta PostgreSQL; foro protegido sin sesión'
