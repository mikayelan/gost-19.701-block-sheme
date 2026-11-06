# ГОСТ 19.701-90 — Генератор блок-схем → draw.io

[![Docker Build](https://github.com/mikayelan/gost-19.701-block-sheme/actions/workflows/docker.yml/badge.svg)](https://github.com/mikayelan/gost-19.701-block-sheme/actions/workflows/docker.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/mikayelan/gost-19.701-block-sheme)](https://hub.docker.com/r/mikayelan/gost-19.701-block-sheme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GOST](https://img.shields.io/badge/GOST-19.701--90-blue)](https://docs.cntd.ru/document/1200030156)
[![Senior](https://img.shields.io/badge/Senior-33y-red)]()

**Кидаешь код → получаешь каноничную блок-схему по ГОСТ 19.701-90 + готовый `.drawio` для diagrams.net / диплома.**

> Сделано Senior Developer 33 года стажа. Понимает Python, JS, C++, Pascal и псевдокод на русском.

![preview](https://via.placeholder.com/900x400/0F172A/FFFFFF?text=GOST+19.701-90+Preview)

---

## 🚀 Быстрый старт для братки (1 команда)

### Вариант A — Docker Hub (самый лёгкий)

```bash
docker pull mikayelan/gost-19.701-block-sheme:latest
docker run -d -p 3000:80 --name gost --restart unless-stopped mikayelan/gost-19.701-block-sheme:latest
# открой http://localhost:3000
```

> Замени `mikayelan` на свой Docker Hub логин после пуша (см. ниже).

### Вариант B — Из репозитория

```bash
git clone https://github.com/mikayelan/gost-19.701-block-sheme.git
cd gost-19.701-block-sheme

# Windows: двойной клик по run.bat
# Mac/Linux:
chmod +x run.sh && ./run.sh
# или
docker compose up -d --build
# → http://localhost:3000
```

### Вариант C — Без докера (для разработки)

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
# → http://localhost:5173
```

---

## 📦 Что умеет

- Парсит `Если/Тогда/Иначе`, `Иначе если`, `Для`, `Пока`, `Ввод/Вывод`, `вызвать`, `{ }`, отступы
- Символы **строго по ГОСТ 19.701-90 / ГОСТ 19.003-80**:
  - Овал — терминатор (Начало/Конец)
  - Прямоугольник — процесс
  - Параллелограмм — ввод/вывод
  - Ромб — решение (Да/Нет)
  - Шестиугольник — подготовка (цикл For)
  - Прямоугольник с полосами — предопред. процесс (вызов)
  - Круг — соединитель
- Ортогональные стрелки, подписи `Да/Нет`, пунктирная петля для циклов
- Live SVG предпросмотр 1:1 как в draw.io
- Экспорт: `.drawio` (валидный mxfile), `.svg`, `.png`

---

## 🐳 Docker

| Файл | Назначение |
|------|------------|
| `Dockerfile` | multi-stage: `node:20-alpine` build → `nginx:1.27-alpine` serve, ~25MB |
| `nginx.conf` | gzip + SPA fallback + кеш `assets/` на год + `/health` |
| `docker-compose.yml` | `host:3000 → container:80` |
| `Dockerfile.dev` | dev с hot-reload на 5173 |

```bash
# собрать
docker build -t gost-19.701:1.0 .

# запустить
docker run -d --name gost-19.701 -p 3000:80 gost-19.701:1.0

# проверить
curl http://localhost:3000/health
# OK GOST 19.701-90

# логи / стоп
docker logs -f gost-19.701
docker stop gost-19.701 && docker rm gost-19.701
```

---

## 🔧 Как пользоваться

1. Выбери пример в селекте слева или вставь свой код
2. Смотри схему справа (зум `+/-`)
3. Жми **Скачать .drawio** — файл готов для диплома
4. Перетяни `.drawio` в https://app.diagrams.net — все блоки двигаемы, можно печатать по ГОСТу

Поддерживаемые конструкции:
```pascal
Начало
Ввод a, b
Если a > b тогда
    max = a
Иначе
    max = b
Вывод max
Конец
```
```python
n = int(input())
fact = 1
for i in range(1, n+1):
    fact = fact * i
print(fact)
```

---

## 🤖 CI/CD (GitHub Actions)

Файл `.github/workflows/docker.yml` автоматически:

- Собирает `linux/amd64 + linux/arm64`
- Пушит в **GHCR** (`ghcr.io/mikayelan/gost-19.701-block-sheme`)
- Пушит в **Docker Hub** (если заданы secrets `DOCKERHUB_mikayelanNAME` / `DOCKERHUB_TOKEN`)

### Настройка Docker Hub:

1. Создай аккаунт: https://hub.docker.com
2. Access Token: Account Settings → Security → New Access Token (Read & Write)
3. В GitHub: `Settings → Secrets and variables → Actions → New repository secret`
   - `DOCKERHUB_mikayelanNAME` = твой логин
   - `DOCKERHUB_TOKEN` = токен
4. Сделай `git push` → Actions соберёт и запушит `mikayelan/gost-19.701-block-sheme:latest`

После этого братка сможет:
```bash
docker pull mikayelan/gost-19.701-block-sheme:latest
```

---

## 📁 Структура

```
gost-19.701-block-sheme/
├── src/
│   ├── lib/parser.js        # парсер ГОСТ
│   ├── lib/layout.js        # раскладка графа
│   ├── lib/drawioExporter.js# генерация mxfile
│   └── App.jsx              # UI + SVG превью
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── public/
└── dist/                    # после npm run build
```

---

## 📜 Стандарт

- ГОСТ 19.701-90 «Схемы алгоритмов, программ, данных и систем»
- ГОСТ 19.003-80 — символы
- Экспорт: `mxfile` (draw.io v21)

---

## 📄 Лицензия

MIT — делай что хочешь, только сохрани авторство. Senior 33y, 2026.

---

## 🆘 FAQ для братки

**Порт 3000 занят?** Поменяй в `docker-compose.yml` `"3000:80"` на `"8080:80"`

**Не открывается?** `docker ps` должен показать `healthy`, Docker Desktop должен быть запущен (кит зелёный)

**Как обновить?** `docker compose down && docker compose up -d --build`

**Как на сервер?**
```bash
docker save gost-19.701:1.0 | gzip > gost.tar.gz
# на сервере
docker load < gost.tar.gz
docker run -d -p 80:80 gost-19.701:1.0
```
