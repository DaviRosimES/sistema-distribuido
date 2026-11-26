import pytest
from sqlalchemy.orm import Session

from app.models.simulacao import SimulacaoModel
from tests.integration.conftest import CORRETORA_VALIDA

PEDIDO = {"valor": 1000, "preco_btc": 500000}


@pytest.fixture
def simulacao(client, corretora):
    return client.post("/simulacoes", json=PEDIDO).json()


def test_post_calcula_e_devolve_o_ranking(client, corretora):
    response = client.post("/simulacoes", json={**PEDIDO, "descricao": "Primeira compra"})

    assert response.status_code == 201
    corpo = response.json()
    assert corpo["descricao"] == "Primeira compra"
    assert corpo["rede"] == "onchain"
    assert corpo["compras_por_saque"] == 1
    assert corpo["melhor_corretora"] == "Corretora A"
    assert corpo["criada_em"]
    item = corpo["ranking"][0]
    assert item["custo_total"] == 115.0
    assert item["custo_pct"] == 11.5
    assert item["sats_recebidos"] == 177_000


def test_post_grava_a_simulacao_no_banco(client, corretora, engine):
    client.post("/simulacoes", json=PEDIDO)

    with Session(engine) as banco:
        salva = banco.query(SimulacaoModel).one()

    assert salva.ranking[0]["corretora_nome"] == "Corretora A"


def test_post_sem_corretora_responde_422(client):
    response = client.post("/simulacoes", json=PEDIDO)

    assert response.status_code == 422
    assert response.json() == {"detail": "Cadastre pelo menos uma corretora ativa antes de simular"}


@pytest.mark.parametrize(
    "alteracao",
    [
        {"valor": 0},
        {"preco_btc": -1},
        {"rede": "pix"},
        {"compras_por_saque": 0},
        {"compras_por_saque": 53},
        {"valor": "10.001"},
    ],
)
def test_post_invalido_responde_422(client, corretora, alteracao):
    assert client.post("/simulacoes", json={**PEDIDO, **alteracao}).status_code == 422


def test_lightning_marca_corretora_sem_lightning_como_inviavel(client, corretora):
    corpo = client.post("/simulacoes", json={**PEDIDO, "rede": "lightning"}).json()

    assert corpo["melhor_corretora"] is None
    assert corpo["ranking"][0]["viavel"] is False
    assert corpo["ranking"][0]["motivo"] == "Não faz saque pela Lightning"


def test_get_lista_e_busca_por_id(client, simulacao):
    assert [s["id"] for s in client.get("/simulacoes").json()] == [simulacao["id"]]
    assert client.get(f"/simulacoes/{simulacao['id']}").json() == simulacao


@pytest.mark.parametrize("metodo", ["GET", "PATCH", "DELETE"])
def test_id_inexistente_responde_404(client, metodo):
    body = {} if metodo == "PATCH" else None

    response = client.request(metodo, "/simulacoes/999", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "Simulação 999 não encontrada"}


def test_patch_de_parametro_recalcula(client, simulacao):
    response = client.patch(f"/simulacoes/{simulacao['id']}", json={"compras_por_saque": 4})

    assert response.status_code == 200
    item = response.json()["ranking"][0]
    assert item["custo_total"] == 160.0
    assert item["economia"] == 300.0


def test_simulacao_continua_depois_de_apagar_a_corretora(client, corretora, simulacao):
    client.delete(f"/corretoras/{corretora['id']}")

    response = client.get(f"/simulacoes/{simulacao['id']}")

    assert response.status_code == 200
    assert response.json()["melhor_corretora"] == "Corretora A"


def test_delete_remove_a_simulacao(client, simulacao):
    assert client.delete(f"/simulacoes/{simulacao['id']}").status_code == 204
    assert client.get(f"/simulacoes/{simulacao['id']}").status_code == 404


def test_ranking_compara_varias_corretoras(client, corretora):
    client.post("/corretoras", json={**CORRETORA_VALIDA, "nome": "Barata", "spread_pct": 0.1})

    corpo = client.post("/simulacoes", json=PEDIDO).json()

    assert [item["corretora_nome"] for item in corpo["ranking"]] == ["Barata", "Corretora A"]


def test_simulacao_em_dolar_tem_o_mesmo_custo_percentual(client, corretora):
    # Mesmo cenário convertido pra dólar com o BTC a US$ 100.000 (R$ 5 por US$ 1):
    # o custo em % não depende da moeda, só os valores mudam
    corpo = client.post(
        "/simulacoes", json={"moeda": "USD", "valor": 200, "preco_btc": 100000}
    ).json()

    item = corpo["ranking"][0]
    assert corpo["moeda"] == "USD"
    assert item["custo_total"] == 23.0
    assert item["custo_pct"] == 11.5
    assert item["sats_recebidos"] == 177_000


def test_simulacao_sem_moeda_e_em_reais(client, simulacao):
    assert simulacao["moeda"] == "BRL"


@pytest.mark.parametrize("moeda", ["EUR", "usd", None])
def test_moeda_invalida_responde_422(client, corretora, moeda):
    assert client.post("/simulacoes", json={**PEDIDO, "moeda": moeda}).status_code == 422


def test_patch_trocando_a_moeda_recalcula(client, simulacao):
    response = client.patch(
        f"/simulacoes/{simulacao['id']}",
        json={"moeda": "USD", "valor": 200, "preco_btc": 100000},
    )

    assert response.json()["moeda"] == "USD"
    assert response.json()["ranking"][0]["custo_total"] == 23.0
