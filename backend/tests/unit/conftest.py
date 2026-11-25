import pytest

from app.services.corretora_service import CorretoraService
from app.services.tarefa_service import TarefaService
from tests.unit.fakes import FakeCorretoraRepository, FakeTarefaRepository


@pytest.fixture
def repository():
    return FakeTarefaRepository()


@pytest.fixture
def service(repository):
    return TarefaService(repository)


@pytest.fixture
def corretora_repository():
    return FakeCorretoraRepository()


@pytest.fixture
def corretora_service(corretora_repository):
    return CorretoraService(corretora_repository)
