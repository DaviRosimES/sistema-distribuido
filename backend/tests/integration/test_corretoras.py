import pytest
from sqlalchemy.orm import Session

from app.models.corretora import CorretoraModel
from tests.integration.conftest import CORRETORA_VALIDA


def test_post_cria_corretora_com_valores_padrao(client):
    response = client.post("/corretoras", json=CORRETORA_VALIDA)

    assert response.status_code == 201
    assert response.json() == {
        **CORRETORA_VALIDA,
        "id": response.json()["id"],
        "saque_minimo_sats": 0,
        "suporta_lightning": False,
        "taxa_saque_lightning_sats": None,
        "ativa": True,
        "observacoes": None,
    }


def test_post_grava_no_banco_com_precisao_decimal(client, engine):
    client.post("/corretoras", json={**CORRETORA_VALIDA, "taxa_negociacao_pct": "0.125"})

    # Confiro com outra sessão, direto na tabela, que o commit aconteceu
    with Session(engine) as banco:
        salva = banco.query(CorretoraModel).one()

    assert str(salva.taxa_negociacao_pct) == "0.125"


@pytest.mark.parametrize(
    "alteracao",
    [
        {"nome": ""},
        {"taxa_negociacao_pct": -1},
        {"spread_pct": 11},
        {"taxa_saque_onchain_sats": -5},
    ],
)
def test_post_invalido_responde_422(client, alteracao):
    response = client.post("/corretoras", json={**CORRETORA_VALIDA, **alteracao})

    assert response.status_code == 422


def test_post_lightning_sem_taxa_responde_422_com_mensagem(client):
    response = client.post("/corretoras", json={**CORRETORA_VALIDA, "suporta_lightning": True})

    assert response.status_code == 422
    assert "Lightning" in response.json()["detail"]


def test_post_nome_repetido_responde_409(client, corretora):
    response = client.post("/corretoras", json={**CORRETORA_VALIDA, "nome": "corretora a"})

    assert response.status_code == 409
    assert response.json() == {"detail": "Já existe uma corretora com esse nome"}


def test_get_lista_e_filtra_por_ativa(client, corretora):
    client.post("/corretoras", json={**CORRETORA_VALIDA, "nome": "Inativa", "ativa": False})

    todas = client.get("/corretoras").json()
    ativas = client.get("/corretoras", params={"ativa": True}).json()

    assert [c["nome"] for c in todas] == ["Corretora A", "Inativa"]
    assert [c["nome"] for c in ativas] == ["Corretora A"]


def test_get_por_id(client, corretora):
    response = client.get(f"/corretoras/{corretora['id']}")

    assert response.status_code == 200
    assert response.json() == corretora


@pytest.mark.parametrize("metodo", ["GET", "PUT", "PATCH", "DELETE"])
def test_id_inexistente_responde_404(client, metodo):
    body = CORRETORA_VALIDA if metodo in ("PUT", "PATCH") else None

    response = client.request(metodo, "/corretoras/999", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "Corretora 999 não encontrada"}


def test_put_substitui_a_corretora(client, corretora):
    novo = {**CORRETORA_VALIDA, "nome": "Corretora B", "spread_pct": 0.3}

    response = client.put(f"/corretoras/{corretora['id']}", json=novo)

    assert response.status_code == 200
    assert response.json()["nome"] == "Corretora B"
    assert response.json()["spread_pct"] == 0.3


def test_patch_liga_lightning_com_taxa(client, corretora):
    response = client.patch(
        f"/corretoras/{corretora['id']}",
        json={"suporta_lightning": True, "taxa_saque_lightning_sats": 10},
    )

    assert response.status_code == 200
    assert response.json()["suporta_lightning"] is True
    assert response.json()["taxa_saque_lightning_sats"] == 10


def test_patch_renomeando_para_nome_existente_responde_409(client, corretora):
    outra = client.post("/corretoras", json={**CORRETORA_VALIDA, "nome": "Corretora B"}).json()

    response = client.patch(f"/corretoras/{outra['id']}", json={"nome": "Corretora A"})

    assert response.status_code == 409


def test_delete_remove_do_banco(client, corretora, engine):
    response = client.delete(f"/corretoras/{corretora['id']}")

    assert response.status_code == 204
    assert client.get(f"/corretoras/{corretora['id']}").status_code == 404
    with Session(engine) as banco:
        assert banco.get(CorretoraModel, corretora["id"]) is None
