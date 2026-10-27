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
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'
