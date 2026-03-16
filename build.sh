#!/bin/sh
# Build script for skills-mcp.
# Builds the Next.js app and migration bundle locally, then stages all
# artifacts into .next/standalone so the Dockerfile can package them
# with a single COPY layer (required for Docker's VFS storage driver).

set -e

echo "==> Installing dependencies..."
npm ci

echo "==> Building Next.js app..."
npm run build

echo "==> Bundling migration script..."
npx esbuild src/db/migrate.ts \
  --bundle \
  --platform=node \
  --external:better-sqlite3 \
  --outfile=dist/migrate.js

echo "==> Staging artifacts into .next/standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp dist/migrate.js .next/standalone/migrate.js

echo "==> Build complete. Run 'docker compose up -d --build' to deploy."
