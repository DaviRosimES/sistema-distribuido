def test_repositorio_comeca_vazio(repository):
    assert repository.listar() == []


def test_criar_gera_ids_sequenciais(repository):
    primeira = repository.criar({"titulo": "A"})
    segunda = repository.criar({"titulo": "B"})

    assert primeira.id == 1
    assert segunda.id == 2


def test_buscar_retorna_tarefa_criada(repository):
    criada = repository.criar({"titulo": "A"})

    assert repository.buscar(criada.id) == criada


def test_buscar_inexistente_retorna_none(repository):
    assert repository.buscar(99) is None


def test_salvar_sobrescreve_tarefa(repository):
    criada = repository.criar({"titulo": "A"})

    repository.salvar(criada.model_copy(update={"titulo": "B"}))

    assert repository.buscar(criada.id).titulo == "B"


def test_remover_retorna_se_removeu(repository):
    criada = repository.criar({"titulo": "A"})

    assert repository.remover(criada.id) is True
    assert repository.remover(criada.id) is False
    assert repository.listar() == []


def test_id_nao_e_reaproveitado_depois_de_remover(repository):
    criada = repository.criar({"titulo": "A"})
    repository.remover(criada.id)

    assert repository.criar({"titulo": "B"}).id == 2
