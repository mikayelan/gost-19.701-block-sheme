# 🐳 Докер для братки — ГОСТ 19.701-90

Собрано Senior'ом 33 года стажа. Один файл — и у братки всё работает без `npm install`.

---

## Вариант 1 — Самый простой (для братки без знаний)

### Windows
1. Установи **Docker Desktop**: https://docs.docker.com/desktop/install/windows-install/
2. Скачай папку `gost-shema` (или архив `gost-docker.zip`)
3. Двойной клик по **`run.bat`**
4. Открой в браузере: **http://localhost:3000**

### Mac / Linux
```bash
# 1. Установи Docker: https://docs.docker.com/get-docker/
# 2. Распакуй архив
cd gost-shema

# 3. Запусти один скрипт
chmod +x run.sh
./run.sh
# готово → http://localhost:3000
```

---

## Вариант 2 — Через docker compose (рекомендуется)

```bash
docker compose up -d --build
# → http://localhost:3000
# проверить: curl http://localhost:3000/health
# остановить: docker compose down
```

## Вариант 3 — Ручками

```bash
docker build -t gost-19.701:1.0 .
docker run -d --name gost-19.701 -p 3000:80 --restart unless-stopped gost-19.701:1.0
# открыть http://localhost:3000
```

## Вариант 4 — Dev режим (с hot-reload)

```bash
docker build -f Dockerfile.dev -t gost-19.701:dev .
docker run --rm -it -p 5173:5173 -v $(pwd)/src:/app/src gost-19.701:dev
# → http://localhost:5173
```

---

## Что внутри образа?

- **Stage 1** `node:20-alpine` — `npm ci` + `npm run build` → `/dist`
- **Stage 2** `nginx:1.27-alpine` — отдаёт статику, `nginx.conf` с gzip + SPA fallback + кеш
- Размер: ~25MB, старт за 1 сек
- Healthcheck: `wget http://localhost/`
- Порт: `80` внутри → `3000` наружу

### Проверка что завёлся
```bash
docker ps
docker logs -f gost-19.701
curl http://localhost:3000/health
# должен вернуть: OK GOST 19.701-90
```

### Как обновить
```bash
docker compose down
docker compose up -d --build
```

### Как удалить
```bash
docker stop gost-19.701 && docker rm gost-19.701
docker rmi gost-19.701:1.0
```

---

## Частые вопросы братки

**Q: Порт 3000 занят?**
A: Поменяй в `docker-compose.yml` строку `"3000:80"` на `"8080:80"` и перезапусти.

**Q: Не открывается в браузере?**
A: Подожди 3 сек после запуска + проверь `docker ps` — статус должен быть `healthy`. Windows: убедись что Docker Desktop запущен (иконка кита зелёная).

**Q: Как передать свой код?**
A: Ничего не надо — код вводится прямо в браузере. Для сохранения `.drawio` жми «Скачать .drawio» внутри приложения.

**Q: Можно на сервер?**
A: Да, залей образ на сервер:
```bash
docker save gost-19.701:1.0 | gzip > gost.tar.gz
# на сервере
docker load < gost.tar.gz
docker run -d -p 80:80 gost-19.701:1.0
```

---

Сделано с любовью к ГОСТу ❤️  Senior 33y
