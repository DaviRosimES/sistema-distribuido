# Variáveis
BACKEND_DIR := backend
POETRY := poetry
APP := app.main:app
HOST := 0.0.0.0
PORT := 8000

.PHONY: install run help

install: ## Instala as dependências do backend com o Poetry
	cd $(BACKEND_DIR) && $(POETRY) install

run: ## Sobe o servidor FastAPI em modo de desenvolvimento (com reload)
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'
