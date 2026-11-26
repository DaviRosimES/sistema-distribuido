from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.core.moeda import Moeda
from app.services.cotacao_service import CotacaoIndisponivelError, CotacaoService
from tests.unit.fakes import FonteFalsa


class Relogio:
    def __init__(self):
        self.atual = datetime(2026, 11, 25, 12, 0, tzinfo=UTC)

    def __call__(self):
        return self.atual

    def avancar(self, segundos):
        self.atual += timedelta(seconds=segundos)


@pytest.fixture
def relogio():
    return Relogio()


def test_usa_a_primeira_fonte_que_responder(relogio):
    principal = FonteFalsa("Principal", "343000")
    reserva = FonteFalsa("Reserva", "344000")

    cotacao = CotacaoService([principal, reserva], agora=relogio).obter()

    assert cotacao.preco_btc == Decimal(343000)
    assert cotacao.fonte == "Principal"
    assert cotacao.consultada_em == relogio()
    assert reserva.chamadas == 0


def test_cai_pra_reserva_quando_a_principal_falha(relogio):
    principal = FonteFalsa("Principal")
    reserva = FonteFalsa("Reserva", "344000")

    cotacao = CotacaoService([principal, reserva], agora=relogio).obter()

    assert cotacao.fonte == "Reserva"
    assert principal.chamadas == 1


def test_todas_as_fontes_falhando_levanta_erro(relogio):
    service = CotacaoService([FonteFalsa("A"), FonteFalsa("B")], agora=relogio)

    with pytest.raises(CotacaoIndisponivelError):
        service.obter()


def test_reaproveita_a_cotacao_dentro_do_cache(relogio):
    fonte = FonteFalsa("A", "343000")
    service = CotacaoService([fonte], cache_segundos=60, agora=relogio)

    primeira = service.obter()
    relogio.avancar(59)
    fonte.preco = "999999"

    assert service.obter() == primeira
    assert fonte.chamadas == 1


def test_consulta_de_novo_quando_o_cache_vence(relogio):
    fonte = FonteFalsa("A", "343000")
    service = CotacaoService([fonte], cache_segundos=60, agora=relogio)

    service.obter()
    relogio.avancar(60)
    fonte.preco = "350000"

    assert service.obter().preco_btc == Decimal(350000)
    assert fonte.chamadas == 2


def test_erro_nao_fica_em_cache(relogio):
    fonte = FonteFalsa("A")
    service = CotacaoService([fonte], agora=relogio)
    with pytest.raises(CotacaoIndisponivelError):
        service.obter()

    fonte.preco = "343000"

    assert service.obter().preco_btc == Decimal(343000)


def test_cada_moeda_tem_o_seu_cache(relogio):
    fonte = FonteFalsa("A", "343000")
    service = CotacaoService([fonte], agora=relogio)

    reais = service.obter(Moeda.BRL)
    dolares = service.obter(Moeda.USD)
    service.obter(Moeda.BRL)

    assert (reais.moeda, dolares.moeda) == (Moeda.BRL, Moeda.USD)
    # A segunda consulta em reais veio do cache; a de dólar precisou ir na fonte
    assert fonte.moedas == [Moeda.BRL, Moeda.USD]
