dev:
	pnpm run dev:2
up:
	docker compose -f chroma-compose.yml up -d
down:
	docker compose -f chroma-compose.yml down