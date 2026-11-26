from app.seed import CORRETORAS
from app.services.corretora_service import CorretoraService
from tests.unit.fakes import FakeCorretoraRepository


def test_seed_cadastra_corretoras_validas_e_com_a_fonte_nas_observacoes():
    service = CorretoraService(FakeCorretoraRepository())

    # Passa pelas mesmas regras do cadastro pela API (nome único, taxa Lightning...)
    criadas = [service.criar(corretora) for corretora in CORRETORAS]

    assert len(criadas) == len(CORRETORAS)
    assert all("Consulta em" in corretora.observacoes for corretora in criadas)
