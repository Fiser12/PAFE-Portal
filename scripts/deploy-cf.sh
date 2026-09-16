#!/usr/bin/env bash
set -euo pipefail

# Construye la wiki y la publica en Cloudflare Pages (proyecto: pafe-wiki) como
# subida directa. El directorio functions/ de la raíz (Basic Auth) lo empaqueta
# wrangler automáticamente.
#
# Credenciales: ~/.cloudflare/ss-propuesta.env con CLOUDFLARE_API_TOKEN y
# CLOUDFLARE_ACCOUNT_ID, igual que singular-solving-propuesta. Se puede apuntar a
# otro fichero con CF_ENV_FILE. En CI las variables vienen del entorno.
#
# SITE_PASSWORD es un secret del proyecto de Pages; se fija una sola vez con:
#   npx wrangler pages secret put SITE_PASSWORD --project-name pafe-wiki

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="pafe-wiki"
BRANCH="destilado"
ENV_FILE="${CF_ENV_FILE:-$HOME/.cloudflare/ss-propuesta.env}"
if [ -f "$ENV_FILE" ]; then set -a; source "$ENV_FILE"; set +a; fi

# Quartz y wrangler necesitan Node 22+: mismo apaño con nvm que en singular
if ! node -e 'process.exit(+process.versions.node.split(".")[0] >= 22 ? 0 : 1)' 2>/dev/null; then
  NVM_BIN="$(ls -d "$HOME/.nvm/versions/node"/v2[2-9]*/bin 2>/dev/null | sort -V | tail -1)"
  [ -n "$NVM_BIN" ] && PATH="$NVM_BIN:$PATH"
fi

cd "$REPO_ROOT"
npx quartz build

# Red de seguridad: no publicar un sitio degradado
count="$(find public/libros -name '*.html' | wc -l | tr -d ' ')"
echo "notas de libro construidas: $count"
[ "$count" -ge 95 ] || { echo "ERROR: se esperaban 95 notas o más"; exit 1; }

npx --yes wrangler@latest pages deploy public \
  --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true
