# ГОСТ 19.701-90 Генератор блок-схем — Senior 33 года Edition
# Multi-stage build: собираем Vite + отдаём через nginx

# === Stage 1: Build ===
FROM node:20-alpine AS build
WORKDIR /app

# Кэшируем зависимости отдельно для скорости
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Собираем прод (Vite делает /dist)
RUN npm run build

# === Stage 2: Production (nginx) ===
FROM nginx:1.27-alpine AS production

# Убираем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Наш конфиг для SPA (history fallback + gzip + кеш)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранный dist
COPY --from=build /app/dist /usr/share/nginx/html

# GOST мета
LABEL maintainer="Senior 33 years <gost@gost.ru>" \
      description="Генератор блок-схем по ГОСТ 19.701-90 → draw.io" \
      version="1.0-gost"

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# nginx -g 'daemon off;' уже в базовом образе
