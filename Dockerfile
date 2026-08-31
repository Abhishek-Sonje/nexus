FROM oven/bun:1.4.0 AS build
WORKDIR /workspace

COPY package.json bun.lock tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/detection/package.json packages/detection/package.json
COPY packages/synthetic/package.json packages/synthetic/package.json
RUN bun install --frozen-lockfile

COPY . .
RUN bun run --filter @nexus/web build
RUN bun run --filter @nexus/worker build
RUN bun build packages/db/src/migrate.ts --outdir packages/db/dist --target node

FROM node:24.20.0-bookworm-slim AS web
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /workspace/config ./config
WORKDIR /app/apps/web
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

FROM node:24.20.0-bookworm-slim AS worker
ENV NODE_ENV=production
WORKDIR /app/apps/worker
COPY --from=build --chown=node:node /workspace/apps/worker/dist ./dist
COPY --from=build --chown=node:node /workspace/config /app/config
USER node
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "dist/health.js"]
CMD ["node", "dist/index.js"]

FROM node:24.20.0-bookworm-slim AS migration
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /workspace/packages/db/dist/migrate.js ./dist/migrate.js
COPY --from=build --chown=node:node /workspace/packages/db/drizzle ./drizzle
USER node
CMD ["node", "dist/migrate.js"]
