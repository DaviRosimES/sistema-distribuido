import pytest

from app.repositories.tarefa_repository import TarefaRepository
from app.services.tarefa_service import TarefaService


@pytest.fixture
def repository():
    return TarefaRepository()


@pytest.fixture
def service(repository):
    return TarefaService(repository)
