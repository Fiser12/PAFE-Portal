#!/usr/bin/env bash
# Descarga el toolkit fijado y le pasa el mando: la receta del build vive en él
# (`okf build`), no aquí. Lo usan el workflow de GitHub Actions y el despliegue manual.
set -euo pipefail

OKF_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$OKF_DIR")"
CACHE_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}/pafe-wiki-okf"

# Node 22+: si el del sistema es anterior, se toma el más nuevo de nvm
if ! node -e 'process.exit(+process.versions.node.split(".")[0] >= 22 ? 0 : 1)' 2>/dev/null; then
  NVM_BIN="$(ls -d "$HOME/.nvm/versions/node"/v2[2-9]*/bin 2>/dev/null | sort -V | tail -1)"
  [ -n "$NVM_BIN" ] && PATH="$NVM_BIN:$PATH"
fi

TOOLKIT_REF="$(cat "$OKF_DIR/quartz-okf.ref")"
TOOLKIT="$CACHE_ROOT/toolkit-${TOOLKIT_REF}"
if [ ! -f "$TOOLKIT/package.json" ]; then
  echo "[okf] descargando toolkit ${TOOLKIT_REF:0:7}"
  mkdir -p "$TOOLKIT"
  curl -fsSL "https://github.com/Zetesis-Labs/quartz-okf/archive/${TOOLKIT_REF}.tar.gz" |
    tar xz --strip-components=1 -C "$TOOLKIT"
fi

exec node "$TOOLKIT/core/bin/okf-build.js" "$REPO_ROOT" --cache "$CACHE_ROOT" "$@"
