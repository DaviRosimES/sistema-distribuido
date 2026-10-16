import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tarefa import TarefaModel


# Não basta a API responder 201: aqui confiro direto no banco, com outra sessão,
# se o que passou pela API realmente foi gravado (commit) na tabela
@pytest.fixture
def banco(engine):
    with Session(engine) as session:
        yield session


def tarefas_no_banco(banco: Session) -> list[TarefaModel]:
    return list(banco.scalars(select(TarefaModel).order_by(TarefaModel.id)))


def test_post_grava_tarefa_no_banco(client, banco):
    client.post("/tarefas", json={"titulo": "Estudar", "descricao": "Prática 5"})

    tarefas = tarefas_no_banco(banco)

    assert len(tarefas) == 1
    assert tarefas[0].titulo == "Estudar"
    assert tarefas[0].descricao == "Prática 5"
    assert tarefas[0].concluida is False


@pytest.mark.parametrize(
    "metodo, body",
    [("put", {"titulo": "Novo", "concluida": True}), ("patch", {"concluida": True})],
)
def test_atualizacao_e_gravada_no_banco(client, banco, tarefa, metodo, body):
    client.request(metodo.upper(), f"/tarefas/{tarefa['id']}", json=body)

    salva = banco.get(TarefaModel, tarefa["id"])

    assert salva.concluida is True
    assert salva.titulo == body.get("titulo", tarefa["titulo"])


def test_delete_remove_tarefa_do_banco(client, banco, tarefa):
    client.delete(f"/tarefas/{tarefa['id']}")

    assert tarefas_no_banco(banco) == []
