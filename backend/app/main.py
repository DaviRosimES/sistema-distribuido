from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, tarefas
from app.core.config import CORS_ORIGINS

# O main.py só cria a aplicação e registra os routers, a lógica fica nas outras camadas
app = FastAPI(title="Sistema Distribuído")

# O frontend roda em outra porta (outra origem), então o navegador só deixa ele ler as
# respostas da API se ela liberar essa origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(health.router)
app.include_router(tarefas.router)
