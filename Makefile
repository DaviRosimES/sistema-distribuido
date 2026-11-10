# Variáveis
BACKEND_DIR := backend
POETRY := poetry
APP := app.main:app
HOST := 0.0.0.0
PORT := 8000
DOCKER_COMPOSE := docker compose

.PHONY: install run test test-unit test-integration lint format db-upgrade db-downgrade db-migration db-current db-history docker-build docker-up docker-down docker-logs docker-ps docker-restart help

install: ## Instala as dependências do backend com o Poetry
	cd $(BACKEND_DIR) && $(POETRY) install

run: ## Sobe o servidor FastAPI em modo de desenvolvimento (com reload)
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

test: ## Executa todos os testes do backend com o Pytest
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v

test-unit: ## Executa só os testes unitários do backend
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v tests/unit

test-integration: ## Executa só os testes de integração do backend
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v tests/integration

lint: ## Verifica o código com o ruff (lint + formatação)
	cd $(BACKEND_DIR) && $(POETRY) run ruff check . && $(POETRY) run ruff format --check .

format: ## Formata o código e corrige o que o ruff consegue sozinho
	cd $(BACKEND_DIR) && $(POETRY) run ruff format . && $(POETRY) run ruff check --fix .

db-upgrade: ## Aplica as migrations pendentes no banco
	cd $(BACKEND_DIR) && $(POETRY) run alembic upgrade head

db-downgrade: ## Desfaz a última migration aplicada
	cd $(BACKEND_DIR) && $(POETRY) run alembic downgrade -1

db-migration: ## Gera uma migration a partir dos modelos (uso: make db-migration msg="descricao")
	@test -n "$(msg)" || (echo 'Informe a descrição: make db-migration msg="descricao"' && exit 1)
	cd $(BACKEND_DIR) && $(POETRY) run alembic revision --autogenerate -m "$(msg)"

db-current: ## Mostra a migration atual do banco
	cd $(BACKEND_DIR) && $(POETRY) run alembic current

db-history: ## Lista o histórico de migrations
	cd $(BACKEND_DIR) && $(POETRY) run alembic history

docker-build: ## Builda as imagens dos serviços via Docker Compose
	$(DOCKER_COMPOSE) build

docker-up: ## Sobe todos os serviços em background, rebuildando se necessário
	$(DOCKER_COMPOSE) up -d --build

docker-down: ## Derruba todos os serviços e remove os containers
	$(DOCKER_COMPOSE) down

docker-logs: ## Acompanha os logs de todos os serviços em tempo real
	$(DOCKER_COMPOSE) logs -f

docker-ps: ## Lista o status dos containers do projeto
	$(DOCKER_COMPOSE) ps

docker-restart: ## Reinicia o serviço do backend (down + up)
	$(DOCKER_COMPOSE) restart backend

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# Frontend (os comandos usam npm --prefix, então funcionam a partir da raiz)
FRONTEND_DIR := frontend
NPM := npm --prefix $(FRONTEND_DIR)

.PHONY: frontend-install frontend-dev frontend-lint frontend-format frontend-check frontend-test frontend-test-e2e frontend-build check-all

frontend-install: ## Instala as dependências do frontend pelo package-lock (npm ci)
	$(NPM) ci

frontend-dev: ## Sobe o frontend em modo de desenvolvimento (Vite)
	$(NPM) run dev

frontend-lint: ## Verifica o frontend com o lint do Biome
	$(NPM) run lint

frontend-format: ## Formata o código do frontend com o Biome
	$(NPM) run format

frontend-check: ## Verifica lint e formatação do frontend sem alterar arquivos
	$(NPM) run lint && $(NPM) run format:check

frontend-test: ## Executa os testes unitários e de integração do frontend (Vitest)
	$(NPM) run test

frontend-test-e2e: ## Roda o Playwright contra uma stack já no ar (E2E_BASE_URL, padrão localhost:5173)
	$(NPM) run test:e2e

frontend-build: ## Gera o build de produção do frontend
	$(NPM) run build

check-all: lint test frontend-check frontend-test frontend-build e2e ## Roda tudo: backend, frontend e E2E (precisa do Docker)

# E2E full-stack numa stack separada da de desenvolvimento: outro projeto do Compose,
# outras portas e um volume próprio do Postgres. As variáveis passadas aqui têm prioridade
# sobre o .env, então o banco de desenvolvimento nunca é tocado.
E2E_PROJECT := sistema-distribuido-e2e
E2E_BACKEND_PORT := 8001
E2E_FRONTEND_PORT := 5174
E2E_COMPOSE := BACKEND_PORT=$(E2E_BACKEND_PORT) FRONTEND_PORT=$(E2E_FRONTEND_PORT) POSTGRES_PORT=5433 \
	CORS_ORIGINS=http://localhost:$(E2E_FRONTEND_PORT),http://127.0.0.1:$(E2E_FRONTEND_PORT) \
	VITE_API_URL=http://localhost:$(E2E_BACKEND_PORT) \
	$(DOCKER_COMPOSE) -p $(E2E_PROJECT)

.PHONY: e2e

e2e: ## Sobe uma stack isolada, roda o E2E full-stack e derruba tudo no final (down -v)
	@$(E2E_COMPOSE) up -d --build --wait; status=$$?; \
	if [ $$status -eq 0 ]; then \
		E2E_BASE_URL=http://localhost:$(E2E_FRONTEND_PORT) $(NPM) run test:e2e; status=$$?; \
	fi; \
	$(E2E_COMPOSE) down -v; \
	exit $$status
