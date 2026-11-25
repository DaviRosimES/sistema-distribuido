from decimal import Decimal

import httpx
import pytest

from app.clients.cotacao import Binance, CoinGecko, FonteIndisponivelError


# MockTransport responde no lugar da internet, então o teste não depende da API externa
def cliente(responder) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(responder))


def responde(status=200, json=None, texto=None):
    def responder(request: httpx.Request) -> httpx.Response:
        if texto is not None:
            return httpx.Response(status, text=texto)
        return httpx.Response(status, json=json)

    return responder


def test_binance_le_o_preco_do_par_btc_brl():
    pedidos = []

    def responder(request):
        pedidos.append(request)
        return httpx.Response(200, json={"symbol": "BTCBRL", "price": "343635.12000000"})

    preco = Binance(cliente(responder)).buscar()

    assert preco == Decimal("343635.12")
    assert pedidos[0].url.params["symbol"] == "BTCBRL"


def test_coingecko_le_o_preco_em_reais():
    preco = CoinGecko(cliente(responde(json={"bitcoin": {"brl": 344014}}))).buscar()

    assert preco == Decimal("344014.00")


@pytest.mark.parametrize(
    "responder",
    [
        responde(status=451, json={"msg": "restricted location"}),
        responde(status=500, json={}),
        responde(texto="<html>bloqueado</html>"),
        responde(json={"symbol": "BTCBRL"}),
        responde(json={"price": "abc"}),
        responde(json={"price": "0"}),
        responde(json={"price": "-1"}),
        responde(json=[]),
    ],
)
def test_binance_falha_com_resposta_ruim(responder):
    with pytest.raises(FonteIndisponivelError):
        Binance(cliente(responder)).buscar()


def test_timeout_vira_fonte_indisponivel():
    def responder(request):
        raise httpx.ConnectTimeout("demorou", request=request)

    with pytest.raises(FonteIndisponivelError):
        CoinGecko(cliente(responder)).buscar()


def test_coingecko_falha_sem_o_campo_brl():
    with pytest.raises(FonteIndisponivelError):
        CoinGecko(cliente(responde(json={"bitcoin": {}}))).buscar()
