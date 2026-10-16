import os

# No Docker Compose o DATABASE_URL vem apontando pro serviço "db".
# O padrão aqui é pra rodar fora do container (make run), usando a porta que o compose expõe.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido",
)
