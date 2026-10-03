import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_tarefa_repository
from app.main import app
from app.repositories.tarefa_repository import TarefaRepository


@pytest.fixture
def client():
    # Cada teste ganha um repositório novo, assim um teste não suja os dados do outro
    repository = TarefaRepository()
    app.dependency_overrides[get_tarefa_repository] = lambda: repository

    # Cliente de teste do FastAPI, assim não preciso subir o servidor com o uvicorn
    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture
def tarefa(client):
    response = client.post("/tarefas", json={"titulo": "Estudar", "descricao": "Prática 4"})
    return response.json()
