# Variáveis
BACKEND_DIR := backend
POETRY := poetry
APP := app.main:app
HOST := 0.0.0.0
PORT := 8000
DOCKER_COMPOSE := docker compose

.PHONY: install run test docker-build docker-up docker-down docker-logs docker-ps docker-restart help

install: ## Instala as dependências do backend com o Poetry
	cd $(BACKEND_DIR) && $(POETRY) install

run: ## Sobe o servidor FastAPI em modo de desenvolvimento (com reload)
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

test: ## Executa os testes do backend com o Pytest
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v

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
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'
