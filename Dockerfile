FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# firebase-tools and test runners are only for local/CI. Installing them
# inside Cloud Build often OOMs or times out the default builder.
RUN node -e "\
  const fs = require('fs');\
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));\
  for (const name of [\
    'firebase-tools',\
    '@firebase/rules-unit-testing',\
    'vitest',\
    '@testing-library/dom',\
    '@testing-library/react',\
    '@testing-library/user-event',\
    'jsdom'\
  ]) {\
    delete pkg.devDependencies[name];\
  }\
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));\
" && npm install --no-audit --no-fund

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV APP_BASE_URL=http://localhost:3000
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:22-bookworm-slim AS runner
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

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
