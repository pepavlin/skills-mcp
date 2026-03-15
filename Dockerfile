FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && \
    npx esbuild src/db/migrate.ts --bundle --platform=node --external:better-sqlite3 --outfile=dist/migrate.js

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy pre-compiled migration script (no tsx/TypeScript runtime needed)
COPY --from=builder /app/dist/migrate.js ./migrate.js

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/skills.db

# PORT is read by Next.js standalone server automatically
CMD ["sh", "-c", "node migrate.js && node server.js"]
