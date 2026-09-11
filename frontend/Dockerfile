# Frontend do Tekvosoft.
#   target dev   -> usado por ./tekvosoft dev  (dev server do React, hot reload)
#   padrão       -> build estático servido por nginx

# ── desenvolvimento ──────────────────────────────────────────
FROM node:24-alpine AS dev
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# O toolchain do React 17 / CRA 5 exige o provider legado de OpenSSL no Node 20+
ENV NODE_OPTIONS=--openssl-legacy-provider
EXPOSE 3000
CMD ["npm", "start"]

# ── compilação de produção ───────────────────────────────────
#
# $BUILDPLATFORM prende esta etapa à arquitetura de QUEM compila, em vez
# da arquitetura de destino. Isso importa muito: o webpack do React roda
# sob emulação QEMU quando o alvo é arm64, e o JIT do V8 quebra lá com
# "qemu: uncaught target signal 4 (Illegal instruction)" de forma
# intermitente — o build falhava em cerca de metade das execuções.
#
# Como a saída (JS, CSS, HTML) é a mesma para qualquer arquitetura, não há
# motivo para compilá-la emulada. Compilamos uma vez, nativamente, e só a
# imagem final é montada por arquitetura.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# ── produção ─────────────────────────────────────────────────
FROM nginx:alpine AS prod
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /usr/src/app/build /var/www/public
COPY --from=build /usr/src/app/node_modules/@socket.io/admin-ui/ui/dist /var/www/public/socket-admin
COPY nginx /etc/nginx
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
