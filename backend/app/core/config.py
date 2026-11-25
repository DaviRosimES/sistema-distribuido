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

# Cotação do BTC: quanto tempo esperar cada fonte externa e por quanto tempo reaproveitar
# a última cotação antes de consultar de novo
COTACAO_TIMEOUT_SEGUNDOS = float(os.getenv("COTACAO_TIMEOUT_SEGUNDOS", "5"))
COTACAO_CACHE_SEGUNDOS = int(os.getenv("COTACAO_CACHE_SEGUNDOS", "60"))
