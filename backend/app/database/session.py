from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import DATABASE_URL

# pool_pre_ping testa a conexão antes de usar, pra não quebrar se o Postgres reiniciar
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db() -> Iterator[Session]:
    # Uma sessão por requisição, sempre fechada no final mesmo se der erro
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
