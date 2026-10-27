import pytest

from app.schemas.tarefa import TarefaCreate, TarefaPatch, TarefaUpdate
from app.services.tarefa_service import TarefaNaoEncontradaError


@pytest.fixture
def tarefa(service):
    return service.criar(TarefaCreate(titulo="Estudar", descricao="Prática 4"))


def test_criar_retorna_tarefa_com_id(service):
    tarefa = service.criar(TarefaCreate(titulo="Estudar"))

    assert tarefa.id == 1
    assert tarefa.titulo == "Estudar"


@pytest.mark.parametrize(
    "concluida, esperados",
    [(None, ["A", "B"]), (True, ["B"]), (False, ["A"])],
)
def test_listar_filtra_por_concluida(service, concluida, esperados):
    service.criar(TarefaCreate(titulo="A"))
    service.criar(TarefaCreate(titulo="B", concluida=True))

    titulos = [tarefa.titulo for tarefa in service.listar(concluida)]

    assert titulos == esperados


def test_buscar_existente(service, tarefa):
    assert service.buscar(tarefa.id) == tarefa


def test_substituir_troca_todos_os_campos(service, tarefa):
    atualizada = service.substituir(tarefa.id, TarefaUpdate(titulo="Novo"))

    assert atualizada.titulo == "Novo"
    # Como o PUT substitui tudo, a descrição que não foi enviada volta pro padrão
    assert atualizada.descricao is None


def test_atualizar_parcial_mantem_campos_nao_enviados(service, tarefa):
    atualizada = service.atualizar_parcial(tarefa.id, TarefaPatch(concluida=True))

    assert atualizada.concluida is True
    assert atualizada.titulo == "Estudar"
    assert atualizada.descricao == "Prática 4"


def test_remover_apaga_tarefa(service, tarefa):
    service.remover(tarefa.id)

    assert service.listar() == []


# Caso de erro: toda operação numa tarefa que não existe tem que levantar a exceção do domínio
@pytest.mark.parametrize(
    "operacao",
    [
        lambda s: s.buscar(99),
        lambda s: s.substituir(99, TarefaUpdate(titulo="X")),
        lambda s: s.atualizar_parcial(99, TarefaPatch(titulo="X")),
        lambda s: s.remover(99),
    ],
    ids=["buscar", "substituir", "atualizar_parcial", "remover"],
)
def test_operacoes_em_tarefa_inexistente_levantam_erro(service, operacao):
    with pytest.raises(TarefaNaoEncontradaError) as erro:
        operacao(service)

    assert erro.value.tarefa_id == 99
