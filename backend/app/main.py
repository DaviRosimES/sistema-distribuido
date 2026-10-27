from fastapi import FastAPI

from app.api.routes import health, tarefas

# O main.py só cria a aplicação e registra os routers, a lógica fica nas outras camadas
app = FastAPI(title="Sistema Distribuído")

app.include_router(health.router)
app.include_router(tarefas.router)
