# syntax=docker/dockerfile:1.7
# Multi-stage build for Next.js 16 standalone output.

# ── 1. deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
# Alpine occasionally needs this for sharp/native deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ── 1b. worker deps (separate so the worker has its own node_modules) ─
FROM node:22-alpine AS workerdeps
WORKDIR /worker
COPY scripts/package.json scripts/package-lock.json* ./
RUN npm install --no-audit --no-fund --omit=dev

# ── 2. build ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. runtime — minimal image, non-root user ────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for safety
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone bundle, static assets, and public folder.
# `output: 'standalone'` in next.config.ts produces .next/standalone with
# its own node_modules — only deps actually used at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Push-worker script + its isolated node_modules — runs as a separate
# docker-compose service using the same image.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=workerdeps --chown=nextjs:nodejs /worker/node_modules ./scripts/node_modules
# Subscriptions directory — mounted as a host volume in prod for persistence.
RUN mkdir -p ./data && chown nextjs:nodejs ./data

USER nextjs
EXPOSE 3000

# Lightweight built-in health check: just GET / and expect a 2xx
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
