import os

# No Docker Compose o DATABASE_URL vem apontando pro serviço "db".
# O padrão aqui é pra rodar fora do container (make run), usando a porta que o compose expõe.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido",
)

# Origens que podem chamar a API pelo navegador, separadas por vírgula.
# Nada de "*": só libero o endereço do frontend.
_CORS_ORIGINS_PADRAO = "http://localhost:5173,http://127.0.0.1:5173"
CORS_ORIGINS = [
    origem.strip()
    for origem in os.getenv("CORS_ORIGINS", _CORS_ORIGINS_PADRAO).split(",")
    if origem.strip()
]
