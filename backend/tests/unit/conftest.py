import pytest

from app.services.tarefa_service import TarefaService
from tests.unit.fakes import FakeTarefaRepository


@pytest.fixture
def repository():
    return FakeTarefaRepository()


@pytest.fixture
def service(repository):
    return TarefaService(repository)
