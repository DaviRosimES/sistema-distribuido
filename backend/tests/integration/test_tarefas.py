import pytest


def test_listar_sem_tarefas_retorna_lista_vazia(client):
    response = client.get("/tarefas")

    assert response.status_code == 200
    assert response.json() == []


def test_criar_tarefa_retorna_201(client):
    response = client.post("/tarefas", json={"titulo": "Estudar"})

    assert response.status_code == 201
    assert response.json() == {"id": 1, "titulo": "Estudar", "descricao": None, "concluida": False}


def test_tarefa_criada_aparece_na_listagem(client, tarefa):
    response = client.get("/tarefas")

    assert response.json() == [tarefa]


@pytest.mark.parametrize("concluida, esperados", [("true", ["B"]), ("false", ["A"])])
def test_listar_com_query_param_concluida(client, concluida, esperados):
    client.post("/tarefas", json={"titulo": "A"})
    client.post("/tarefas", json={"titulo": "B", "concluida": True})

    response = client.get("/tarefas", params={"concluida": concluida})

    assert [t["titulo"] for t in response.json()] == esperados


def test_buscar_tarefa_por_id(client, tarefa):
    response = client.get(f"/tarefas/{tarefa['id']}")

    assert response.status_code == 200
    assert response.json() == tarefa


def test_put_substitui_tarefa(client, tarefa):
    response = client.put(f"/tarefas/{tarefa['id']}", json={"titulo": "Novo", "concluida": True})

    assert response.status_code == 200
    assert response.json() == {"id": tarefa["id"], "titulo": "Novo", "descricao": None, "concluida": True}


def test_patch_atualiza_so_campos_enviados(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={"concluida": True})

    assert response.status_code == 200
    assert response.json() == {**tarefa, "concluida": True}


def test_delete_remove_tarefa(client, tarefa):
    response = client.delete(f"/tarefas/{tarefa['id']}")

    assert response.status_code == 204
    assert client.get(f"/tarefas/{tarefa['id']}").status_code == 404


# Caso de erro: qualquer método numa tarefa que não existe tem que dar 404
@pytest.mark.parametrize(
    "metodo, body",
    [("get", None), ("put", {"titulo": "X"}), ("patch", {"titulo": "X"}), ("delete", None)],
)
def test_tarefa_inexistente_retorna_404(client, metodo, body):
    kwargs = {"json": body} if body is not None else {}

    response = client.request(metodo.upper(), "/tarefas/99", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Tarefa 99 não encontrada"}


# Caso de erro: body inválido tem que ser barrado pelo Pydantic com 422
@pytest.mark.parametrize(
    "metodo, rota, body",
    [
        ("post", "/tarefas", {}),
        ("post", "/tarefas", {"titulo": ""}),
        ("put", "/tarefas/1", {"descricao": "sem título"}),
        ("patch", "/tarefas/1", {"titulo": None}),
    ],
)
def test_body_invalido_retorna_422(client, tarefa, metodo, rota, body):
    response = client.request(metodo.upper(), rota, json=body)

    assert response.status_code == 422


# Caso de erro: o path param precisa ser um inteiro positivo
@pytest.mark.parametrize("tarefa_id", ["abc", "0", "-1"])
def test_path_param_invalido_retorna_422(client, tarefa_id):
    response = client.get(f"/tarefas/{tarefa_id}")

    assert response.status_code == 422


def test_query_param_invalido_retorna_422(client):
    response = client.get("/tarefas", params={"concluida": "talvez"})

    assert response.status_code == 422
