from decimal import Decimal

import pytest

from app.schemas.corretora import CorretoraCreate, CorretoraPatch
from app.schemas.simulacao import SimulacaoCreate, SimulacaoPatch
from app.services.simulacao_service import SemCorretorasAtivasError, SimulacaoNaoEncontradaError

# Mesmos números do teste da calculadora: R$ 1000 a R$ 500.000/BTC custam R$ 115 na "Cara"
PEDIDO = SimulacaoCreate(valor="1000", preco_btc="500000")


@pytest.fixture
def corretoras(corretora_service):
    def criar(nome, spread):
        return corretora_service.criar(
            CorretoraCreate(
                nome=nome,
                taxa_negociacao_pct="0.5",
                spread_pct=spread,
                taxa_saque_onchain_sats=20_000,
            )
        )

    return criar("Cara", "1"), criar("Barata", "0.2")


def test_criar_salva_o_ranking_ordenado(simulacao_service, corretoras):
    simulacao = simulacao_service.criar(PEDIDO)

    assert simulacao.id == 1
    assert [item["corretora_nome"] for item in simulacao.ranking] == ["Barata", "Cara"]
    assert simulacao.ranking[1]["custo_total"] == 115.0


def test_criar_sem_corretoras_ativas_levanta_erro(simulacao_service, corretora_service):
    corretora_service.criar(
        CorretoraCreate(
            nome="Inativa",
            taxa_negociacao_pct="0.5",
            spread_pct="1",
            taxa_saque_onchain_sats=20_000,
            ativa=False,
        )
    )

    with pytest.raises(SemCorretorasAtivasError):
        simulacao_service.criar(PEDIDO)


def test_ranking_salvo_nao_muda_quando_a_corretora_muda(
    simulacao_service, corretora_service, corretoras
):
    cara, _ = corretoras
    simulacao = simulacao_service.criar(PEDIDO)

    corretora_service.atualizar_parcial(cara.id, CorretoraPatch(spread_pct="0"))

    assert simulacao_service.buscar(simulacao.id).ranking[1]["custo_total"] == 115.0


def test_patch_so_da_descricao_mantem_o_ranking(simulacao_service, corretora_service, corretoras):
    cara, _ = corretoras
    simulacao = simulacao_service.criar(PEDIDO)
    corretora_service.atualizar_parcial(cara.id, CorretoraPatch(spread_pct="0"))

    atualizada = simulacao_service.atualizar_parcial(
        simulacao.id, SimulacaoPatch(descricao="Compra de dezembro")
    )

    assert atualizada.descricao == "Compra de dezembro"
    assert atualizada.ranking[1]["custo_total"] == 115.0


def test_patch_de_parametro_recalcula_com_as_taxas_atuais(simulacao_service, corretoras):
    simulacao = simulacao_service.criar(PEDIDO)

    atualizada = simulacao_service.atualizar_parcial(
        simulacao.id, SimulacaoPatch(compras_por_saque=4)
    )

    cara = next(item for item in atualizada.ranking if item["corretora_nome"] == "Cara")
    assert atualizada.compras_por_saque == 4
    assert cara["custo_total"] == 160.0
    assert cara["economia"] == 300.0


def test_listar_traz_as_mais_recentes_primeiro(simulacao_service, corretoras):
    simulacao_service.criar(PEDIDO)
    simulacao_service.criar(PEDIDO.model_copy(update={"valor": Decimal(2000)}))

    assert [s.valor for s in simulacao_service.listar()] == [Decimal(2000), Decimal(1000)]


def test_remover_e_buscar_inexistente(simulacao_service, corretoras):
    simulacao = simulacao_service.criar(PEDIDO)

    simulacao_service.remover(simulacao.id)

    with pytest.raises(SimulacaoNaoEncontradaError):
        simulacao_service.buscar(simulacao.id)
