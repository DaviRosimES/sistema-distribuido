import pytest

from app.services.corretora_service import CorretoraService
from app.services.simulacao_service import SimulacaoService
from tests.unit.fakes import (
    FakeCorretoraRepository,
    FakeSimulacaoRepository,
)


@pytest.fixture
def corretora_repository():
    return FakeCorretoraRepository()


@pytest.fixture
def corretora_service(corretora_repository):
    return CorretoraService(corretora_repository)


@pytest.fixture
def simulacao_service(corretora_repository):
    return SimulacaoService(FakeSimulacaoRepository(), corretora_repository)
