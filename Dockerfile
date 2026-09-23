# --- BASE ---
FROM node:24-alpine AS base
RUN corepack enable
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# --- DEPENDENCIES ---
FROM base AS deps
WORKDIR /app

# Solo lo necesario para instalar (mejor cacheo de capas)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# --- WIKI ---
# Misma receta que Vercel, sin credenciales ni conexión a PostgreSQL.
FROM base AS wiki
# Quartz usa el shebang `env -S`, no soportado por el env de BusyBox.
RUN apk add --no-cache bash coreutils curl git python3
WORKDIR /app
COPY apps/wiki ./apps/wiki
COPY apps/web/scripts/build-wiki.mjs apps/web/scripts/wiki-fichas.mjs ./apps/web/scripts/
COPY apps/web/src/modules/catalog/wiki-fichas.json ./apps/web/src/modules/catalog/wiki-fichas.json
RUN node apps/web/scripts/build-wiki.mjs

# --- SOURCE / MIGRATIONS ---
FROM deps AS source
COPY . .

FROM source AS migrator
WORKDIR /app/apps/web
ENV NODE_ENV=production
CMD ["node", "scripts/docker/migrate.mjs"]

# --- BUILDER ---
FROM source AS builder
COPY --from=wiki /app/apps/web/public/wiki ./apps/web/public/wiki
COPY --from=wiki /app/apps/web/src/modules/catalog/wiki-fichas.json ./apps/web/src/modules/catalog/wiki-fichas.json

# NEXT_PUBLIC_* se inlinea en el bundle de cliente en tiempo de build.
# Pásalo con: docker build --build-arg NEXT_PUBLIC_SERVER_URL=https://www.pafe-formakuntza.com
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ARG S3_PUBLIC_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV S3_PUBLIC_URL=${S3_PUBLIC_URL}

WORKDIR /app/apps/web
# compile-only: compila el bundle SIN "Collecting page data" (no necesita base de
# datos en tiempo de build). La generación/render se difiere al runtime.
RUN npx next build --experimental-build-mode compile

# --- RUNNER ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salida standalone de Next (incluye node_modules de producción trazados)
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# Las migraciones se ejecutan antes, con el target migrator; nunca al arrancar.
ENV PAYLOAD_RUN_MIGRATIONS=false
ENV PAYLOAD_DISABLE_PUSH=true
ENV SEED_MOCK_DATA=false
CMD ["node", "apps/web/server.js"]
