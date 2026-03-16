.PHONY: build deploy down logs

## Build app locally and stage artifacts for Docker packaging.
build:
	./build.sh

## Full deploy: build locally then start via docker compose.
deploy: build
	docker compose up -d --build

## Stop and remove containers.
down:
	docker compose down

## Tail container logs.
logs:
	docker compose logs -f
