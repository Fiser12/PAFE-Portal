# --- BASE ---
FROM node:24-alpine AS base
RUN corepack enable

# --- DEPENDENCIES ---
FROM base AS deps
# libc6-compat es necesario para Payload/Sharp en Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Solo lo necesario para instalar (mejor cacheo de capas)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# --- BUILDER ---
FROM base AS builder
WORKDIR /app

# Reutilizamos node_modules ya instalados
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Código fuente (respetando .dockerignore)
COPY . .

# NEXT_PUBLIC_* se inlinea en el bundle de cliente en tiempo de build.
# Pásalo con: docker build --build-arg NEXT_PUBLIC_SERVER_URL=https://www.pafe-formakuntza.com
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}

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

# El servidor standalone lee process.env directamente en runtime.
# Las migraciones (prodMigrations en payload.config) se aplican al inicializar Payload.
CMD ["node", "apps/web/server.js"]
