import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.repositories.tarefa_repository import TarefaRepository

# Sem TEST_DATABASE_URL os testes usam SQLite em memória, assim o make test roda
# sem precisar subir o Postgres.
# No CI a variável aponta pro Postgres do workflow, então lá os testes rodam no banco de verdade.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")


@pytest.fixture(scope="session")
def engine():
    if TEST_DATABASE_URL.startswith("sqlite"):
        # StaticPool mantém uma conexão só, senão cada conexão teria um banco em memória diferente.
        # check_same_thread=False porque o TestClient roda a app em outra thread.
        engine = create_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(TEST_DATABASE_URL)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine):
    # Cria as tabelas antes e apaga depois de cada teste, assim um teste não suja os dados do outro
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture
def repository(db_session):
    return TarefaRepository(db_session)


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session

    # Cliente de teste do FastAPI, assim não preciso subir o servidor com o uvicorn
    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture
def tarefa(client):
    response = client.post("/tarefas", json={"titulo": "Estudar", "descricao": "Prática 4"})
    return response.json()
