import pytest

from app.schemas.tarefa import TarefaCreate, TarefaPatch, TarefaUpdate
from app.services.tarefa_service import TarefaDuplicadaError, TarefaNaoEncontradaError


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


def test_criar_com_titulo_repetido_levanta_erro(service, tarefa):
    with pytest.raises(TarefaDuplicadaError) as erro:
        service.criar(TarefaCreate(titulo=tarefa.titulo))

    assert erro.value.titulo == "Estudar"
    assert len(service.listar()) == 1


def test_substituir_mantendo_o_proprio_titulo_funciona(service, tarefa):
    atualizada = service.substituir(tarefa.id, TarefaUpdate(titulo="Estudar", concluida=True))

    assert atualizada.concluida is True


# Trocar o título pra um que outra tarefa já usa tem que dar erro, tanto no PUT quanto no PATCH
@pytest.mark.parametrize(
    "operacao",
    [
        lambda s, tarefa_id: s.substituir(tarefa_id, TarefaUpdate(titulo="Estudar")),
        lambda s, tarefa_id: s.atualizar_parcial(tarefa_id, TarefaPatch(titulo="Estudar")),
    ],
    ids=["substituir", "atualizar_parcial"],
)
def test_trocar_para_titulo_de_outra_tarefa_levanta_erro(service, tarefa, operacao):
    outra = service.criar(TarefaCreate(titulo="Revisar"))

    with pytest.raises(TarefaDuplicadaError):
        operacao(service, outra.id)

    assert service.buscar(outra.id).titulo == "Revisar"


def test_patch_sem_titulo_nao_confere_duplicidade(service, tarefa):
    atualizada = service.atualizar_parcial(tarefa.id, TarefaPatch(concluida=True))

    assert atualizada.concluida is True
