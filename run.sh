#!/usr/bin/env bash
set -e
echo "🔧 ГОСТ 19.701-90 — Сборка Docker образа (Senior 33y)"
echo "─────────────────────────────────────────────────"

if ! command -v docker &> /dev/null; then
  echo "❌ Докер не найден. Установи Docker Desktop: https://docs.docker.com/get-docker/"
  exit 1
fi

IMAGE="gost-19.701:1.0"
PORT=3000

echo "📦 Собираю образ $IMAGE ..."
docker build -t $IMAGE .

echo "🚀 Запускаю контейнер на http://localhost:$PORT ..."
# Убить старый если есть
docker rm -f gost-19.701 2>/dev/null || true

docker run -d \
  --name gost-19.701 \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE

echo ""
echo "✅ ГОТОВО, БРАТИК!"
echo "👉 Открой: http://localhost:$PORT"
echo "📄 Health:  http://localhost:$PORT/health"
echo ""
echo "Команды:"
echo "  docker logs -f gost-19.701   — логи"
echo "  docker stop gost-19.701      — стоп"
echo "  docker rm gost-19.701         — удалить"
echo ""
