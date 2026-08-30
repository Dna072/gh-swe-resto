# Pull Node via Google's Docker Hub mirror. Cloud Build often hits Hub rate limits
# on `node:22-bookworm-slim`, which fails as a generic "docker step 0" error.
FROM mirror.gcr.io/library/node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/prepare-docker-packagejson.mjs ./scripts/prepare-docker-packagejson.mjs
# Emulator/test packages are not needed to compile the app.
RUN node scripts/prepare-docker-packagejson.mjs \
  && rm -f package-lock.json \
  && npm install --no-audit --no-fund

FROM mirror.gcr.io/library/node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV APP_BASE_URL=http://localhost:3000
ENV NODE_OPTIONS=--max-old-space-size=6144
RUN npm run build \
  && test -f .next/standalone/server.js

FROM mirror.gcr.io/library/node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/data /app/public/uploads \
  && chown -R nextjs:nodejs /app/data /app/public/uploads

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next standalone tracing omits nested google-auth deps (gcp-metadata).
# Overlay the builder install so Firebase Admin can load on Cloud Run.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
