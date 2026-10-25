# syntax=docker/dockerfile:1
# Pollar Studio (Next.js). En Dokploy: Build Type = Dockerfile, Docker Context Path = "."

FROM node:24.17.0-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# corepack toma la version de pnpm del campo packageManager de package.json.
RUN corepack enable
ENV CI=true
WORKDIR /app

# ---- build ----
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dokploy pasa NEXT_PUBLIC_* como build args; Next los inlinea en el bundle del
# cliente, asi que tienen que existir antes de `pnpm build`.
ARG NEXT_PUBLIC_HUB_API_URL
ENV NEXT_PUBLIC_HUB_API_URL=$NEXT_PUBLIC_HUB_API_URL
RUN pnpm build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prune --prod

# ---- runner ----
FROM node:24.17.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
