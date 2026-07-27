#!/usr/bin/env bash
# Corrige título y autoría del catálogo en la base de datos que diga seed-remote.env
# (p. ej. la Neon de producción), ejecutando fix-catalog-metadata.ts desde el devcontainer.
#
# Uso:
#   ./fix-catalog-remote.sh            # dry-run: enumera lo que cambiaría
#   ./fix-catalog-remote.sh --apply    # escribe
#
# Requiere:
#   - seed-remote.env junto a este script (mismas credenciales que el seed)
#   - el devcontainer de PAFE arrancado:
#       docker compose -p pafe-portal_devcontainer -f .devcontainer/docker-compose.yml up -d
#
# Es idempotente: en una segunda pasada no cambia nada.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/seed-remote.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: falta $ENV_FILE"
  echo "Copia seed-remote.env.example a seed-remote.env y rellena los secretos."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
: "${DATABASE_URL:?falta DATABASE_URL en seed-remote.env}"
: "${PAYLOAD_SECRET:?falta PAYLOAD_SECRET en seed-remote.env}"

CONTAINER=pafe-portal_devcontainer-app-1
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: el devcontainer no está corriendo. Arráncalo con:"
  echo "  docker compose -p pafe-portal_devcontainer -f .devcontainer/docker-compose.yml up -d"
  exit 1
fi

echo "Corrigiendo el catálogo de: $(echo "$DATABASE_URL" | sed -E 's#//[^@]+@#//***@#')"
[ "${1:-}" = "--apply" ] && echo "MODO ESCRITURA" || echo "dry-run (añade --apply para escribir)"

# SEED_MOCK_DATA=false es imprescindible: apps/web/.env.local lo pone en true y el
# contenedor lo carga aunque NODE_ENV sea production, de modo que el onInit de Payload
# sembraría usuarios de prueba y catálogo mock en la base remota que se le pase.
exec docker exec \
  -e NODE_ENV=production \
  -e SEED_MOCK_DATA=false \
  -e DATABASE_URL="$DATABASE_URL" \
  -e PAYLOAD_SECRET="$PAYLOAD_SECRET" \
  -w /workspace/apps/web \
  "$CONTAINER" \
  pnpm payload run scripts/fix-catalog-metadata.ts -- "$@"
