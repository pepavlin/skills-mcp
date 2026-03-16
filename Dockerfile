# This Dockerfile expects pre-built artifacts in .next/standalone.
# Run ./build.sh (or `make build`) before `docker compose up --build`.
#
# The .next/standalone directory must contain:
#   - server.js, node_modules/, .next/ (from `next build`)
#   - .next/static/  (copied by build.sh)
#   - public/        (copied by build.sh)
#   - migrate.js     (bundled from src/db/migrate.ts by build.sh)

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy all pre-staged artifacts in one layer (minimizes disk usage with VFS driver)
COPY --chown=nextjs:nodejs .next/standalone ./

USER nextjs

ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/skills.db

# PORT is read by Next.js standalone server automatically
CMD ["sh", "-c", "node migrate.js && node server.js"]
