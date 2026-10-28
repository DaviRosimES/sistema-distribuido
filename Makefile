# Variáveis
BACKEND_DIR := backend
POETRY := poetry
APP := app.main:app
HOST := 0.0.0.0
PORT := 8000
DOCKER_COMPOSE := docker compose

.PHONY: install run test test-unit test-integration docker-build docker-up docker-down docker-logs docker-ps docker-restart help

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

frontend-test-e2e: ## Executa os testes E2E do frontend (Playwright)
	$(NPM) run test:e2e

frontend-build: ## Gera o build de produção do frontend
	$(NPM) run build

check-all: test frontend-check frontend-test frontend-build frontend-test-e2e ## Roda as verificações do backend e do frontend
