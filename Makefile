.PHONY: build deploy down logs

## Build app locally (for local dev / CI outside Docker).
build:
	./build.sh

## Deploy: build inside Docker and start containers.
deploy:
	docker compose up -d --build

## Stop and remove containers.
down:
	docker compose down

## Tail container logs.
logs:
	docker compose logs -f
