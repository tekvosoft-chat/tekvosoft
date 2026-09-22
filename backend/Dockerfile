# syntax=docker/dockerfile:1.7-labs
#
# Backend do vuup.me.
#   target dev   -> usado por ./tekvosoft dev  (código montado do host, hot reload)
#   padrão       -> imagem de produção, sem código-fonte dentro

# ── dependências (compartilhadas entre dev e build) ──────────
FROM node:24 AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ── desenvolvimento ──────────────────────────────────────────
FROM node:24 AS dev
WORKDIR /usr/src/app

# psql: usado pelo entrypoint para esperar o banco e importar dados
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN chmod +x scripts/*.sh

ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000 9229

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["npm", "run", "dev:server"]

# ── compilação de produção ───────────────────────────────────
FROM deps AS build
WORKDIR /usr/src/app
COPY . .
RUN npm run generate:i18nkeys && npm run build

# ── produção ─────────────────────────────────────────────────
FROM node:24 AS prod
WORKDIR /usr/src/app

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# Só os artefatos compilados — o código-fonte não vai para produção.
COPY --from=build --parents \
  /usr/src/app/./dist \
  /usr/src/app/./node_modules \
  /usr/src/app/./package.json \
  /usr/src/app/./scripts \
  .
RUN chmod +x scripts/*.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["node", "dist/server.js"]
