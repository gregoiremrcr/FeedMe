FROM node:22-bookworm-slim AS dependencies

WORKDIR /app
COPY package.json ./
# Install in the target Linux image so npm selects the matching native
# packages (notably lightningcss) instead of reusing a host-specific lock.
RUN npm install --global npm@12.2.0 \
    && npm install --ignore-scripts

FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN mkdir -p /app && chown node:node /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

HEALTHCHECK --interval=10s --timeout=5s --retries=10 \
  CMD node -e "fetch('http://localhost:3000').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["node", "server.js"]
