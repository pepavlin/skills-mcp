# Multi-stage build — no pre-build step required.
# Just run: docker compose up --build

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

# Install build tools required for native modules (e.g. better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (produces .next/standalone due to output: 'standalone' in next.config.ts)
RUN npm run build

# Bundle migration script into standalone dir
RUN npx esbuild src/db/migrate.ts \
      --bundle \
      --platform=node \
      --external:better-sqlite3 \
      --outfile=.next/standalone/migrate.js

# Copy static assets into standalone (required by Next.js standalone server)
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

# ── Stage 3: production image ──────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/skills.db

# PORT is read by Next.js standalone server automatically
CMD ["sh", "-c", "node migrate.js && node server.js"]
