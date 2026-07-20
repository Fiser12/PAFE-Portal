#!/usr/bin/env bash
# Siembra la base de datos que diga seed-remote.env (p. ej. Neon de producción)
# ejecutando el seed completo desde el devcontainer, sin lambdas que lo corten.
#
# Uso:
#   ./seed-remote.sh
#
# Requiere:
#   - seed-remote.env junto a este script (copia seed-remote.env.example)
#   - el devcontainer de PAFE arrancado
#
# Es idempotente: si el catálogo ya está sembrado sale en segundos.
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

echo "Sembrando contra: $(echo "$DATABASE_URL" | sed -E 's#//[^@]+@#//***@#')"
exec docker exec \
  -e NODE_ENV=production \
  -e DATABASE_URL \
  -e PAYLOAD_SECRET \
  "$CONTAINER" \
  bash -c "cd /workspace/apps/web && pnpm payload run scripts/run-seed.ts"
