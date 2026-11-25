from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.api.dependencies import get_cotacao_service
from app.main import app
from app.services.cotacao_service import CotacaoService
from tests.unit.fakes import FonteFalsa


@pytest.fixture
def com_fontes(client):
    # Troca as fontes reais (internet) por falsas só durante o teste
    def configurar(*fontes):
        service = CotacaoService(
            list(fontes), agora=lambda: datetime(2026, 11, 25, 12, 0, tzinfo=UTC)
        )
        app.dependency_overrides[get_cotacao_service] = lambda: service

    yield configurar
    app.dependency_overrides.pop(get_cotacao_service, None)


def test_get_cotacao_devolve_preco_fonte_e_horario(client, com_fontes):
    com_fontes(FonteFalsa("Binance", Decimal("343635.12")))

    response = client.get("/cotacao")

    assert response.status_code == 200
    assert response.json() == {
        "preco_btc_brl": 343635.12,
        "fonte": "Binance",
        "consultada_em": "2026-11-25T12:00:00Z",
    }


def test_get_cotacao_usa_a_reserva(client, com_fontes):
    com_fontes(FonteFalsa("Binance"), FonteFalsa("CoinGecko", "344014"))

    assert client.get("/cotacao").json()["fonte"] == "CoinGecko"


def test_get_cotacao_responde_503_quando_nenhuma_fonte_responde(client, com_fontes):
    com_fontes(FonteFalsa("Binance"), FonteFalsa("CoinGecko"))

    response = client.get("/cotacao")

    assert response.status_code == 503
    assert "Informe o preço do BTC manualmente" in response.json()["detail"]
