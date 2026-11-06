IMAGE=gost-19.701
TAG=1.0
PORT=3000

build:
	docker build -t $(IMAGE):$(TAG) .

run:
	docker rm -f gost-19.701 2>/dev/null || true
	docker run -d --name gost-19.701 -p $(PORT):80 --restart unless-stopped $(IMAGE):$(TAG)
	@echo "👉 http://localhost:$(PORT)"

up:
	docker compose up -d --build
	@echo "👉 http://localhost:3000"

down:
	docker compose down

logs:
	docker logs -f gost-19.701

clean:
	docker rmi $(IMAGE):$(TAG) || true
	rm -rf dist

dev:
	docker build -f Dockerfile.dev -t $(IMAGE):dev .
	docker run --rm -it -p 5173:5173 -v $$(pwd)/src:/app/src -v $$(pwd)/public:/app/public $(IMAGE):dev

.PHONY: build run up down logs clean dev
