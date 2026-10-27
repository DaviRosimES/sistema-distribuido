from app.models.tarefa import TarefaModel


def test_repositorio_comeca_vazio(repository):
    assert repository.listar() == []


def test_salvar_gera_ids_sequenciais(repository):
    primeira = repository.salvar(TarefaModel(titulo="A"))
    segunda = repository.salvar(TarefaModel(titulo="B"))

    assert primeira.id == 1
    assert segunda.id == 2


def test_salvar_aplica_valor_padrao_de_concluida(repository):
    tarefa = repository.salvar(TarefaModel(titulo="A"))

    assert tarefa.concluida is False


def test_buscar_retorna_tarefa_salva(repository):
    salva = repository.salvar(TarefaModel(titulo="A"))

    assert repository.buscar(salva.id) == salva


def test_buscar_inexistente_retorna_none(repository):
    assert repository.buscar(99) is None


def test_salvar_atualiza_tarefa_existente(repository):
    salva = repository.salvar(TarefaModel(titulo="A"))

    salva.titulo = "B"
    repository.salvar(salva)

    assert repository.buscar(salva.id).titulo == "B"
    assert len(repository.listar()) == 1


def test_remover_apaga_tarefa(repository):
    salva = repository.salvar(TarefaModel(titulo="A"))

    repository.remover(salva)

    assert repository.buscar(salva.id) is None
    assert repository.listar() == []
