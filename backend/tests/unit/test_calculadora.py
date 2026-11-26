from dataclasses import dataclass
from decimal import Decimal

import pytest

from app.services.calculadora import (
    Rede,
    calcular_custo,
    ranquear,
    taxa_saque_sats,
    valor_minimo_por_compra,
)

# Preço redondo pra dar pra conferir as contas na mão: 1 sat = R$ 0,005
PRECO = Decimal(500_000)


@dataclass
class Corretora:
    id: int = 1
    nome: str = "A"
    taxa_negociacao_pct: Decimal = Decimal("0.5")
    spread_pct: Decimal = Decimal("1")
    taxa_saque_onchain_sats: int = 20_000
    saque_minimo_sats: int = 0
    suporta_lightning: bool = False
    taxa_saque_lightning_sats: int | None = None
    ativa: bool = True


def test_custo_de_uma_compra_com_saque_onchain():
    # R$ 1000: taxa 0,5% = R$ 5, spread 1% = R$ 10, sobram R$ 985 = 197.000 sats.
    # Saque de 20.000 sats (R$ 100) -> chegam 177.000 sats = R$ 885. Custo R$ 115 (11,5%).
    custo = calcular_custo(Corretora(), Decimal(1000), PRECO, Rede.ONCHAIN)

    assert custo.viavel is True
    assert custo.taxa_negociacao == Decimal("5.00")
    assert custo.spread == Decimal("10.00")
    assert custo.taxa_saque == Decimal("100.00")
    assert custo.sats_recebidos == 177_000
    assert custo.custo_total == Decimal("115.00")
    assert custo.custo_pct == Decimal("11.500")
    assert custo.economia == Decimal("0.00")


def test_juntar_saques_dilui_a_taxa_fixa():
    # 4 compras de R$ 1000 e 1 saque: custo R$ 60 de taxas + R$ 100 de saque = R$ 160 (4%).
    # Sacando a cada compra seriam 4 x R$ 115 = R$ 460, então a economia é R$ 300.
    custo = calcular_custo(Corretora(), Decimal(1000), PRECO, Rede.ONCHAIN, compras_por_saque=4)

    assert custo.custo_total == Decimal("160.00")
    assert custo.custo_pct == Decimal("4.000")
    assert custo.economia == Decimal("300.00")


def test_lightning_usa_a_taxa_lightning():
    corretora = Corretora(suporta_lightning=True, taxa_saque_lightning_sats=200)

    custo = calcular_custo(corretora, Decimal(1000), PRECO, Rede.LIGHTNING)

    # 197.000 - 200 = 196.800 sats = R$ 984 -> custo R$ 16
    assert custo.taxa_saque_sats == 200
    assert custo.custo_total == Decimal("16.00")


def test_lightning_em_corretora_sem_lightning_e_inviavel():
    custo = calcular_custo(Corretora(), Decimal(1000), PRECO, Rede.LIGHTNING)

    assert custo.viavel is False
    assert custo.motivo == "Não faz saque pela Lightning"
    assert custo.taxa_saque_sats is None


def test_compra_abaixo_do_saque_minimo_e_inviavel():
    custo = calcular_custo(Corretora(saque_minimo_sats=300_000), Decimal(1000), PRECO, Rede.ONCHAIN)

    assert custo.viavel is False
    assert "saque mínimo de 300000 sats" in custo.motivo


def test_taxa_de_saque_maior_que_a_compra_e_inviavel():
    # R$ 50 compram 9.850 sats, menos que os 20.000 da taxa de saque
    custo = calcular_custo(Corretora(), Decimal(50), PRECO, Rede.ONCHAIN)

    assert custo.viavel is False
    assert custo.motivo == "A taxa de saque é maior que o valor comprado"
    assert custo.sats_recebidos == 0


def test_sats_comprados_sao_arredondados_para_baixo():
    # R$ 1000,01 -> líquido 985,00985 = 197.001,97 sats -> credita 197.001
    custo = calcular_custo(Corretora(), Decimal("1000.01"), PRECO, Rede.ONCHAIN)

    assert custo.sats_recebidos == 177_001


def test_taxa_saque_por_rede():
    corretora = Corretora(suporta_lightning=True, taxa_saque_lightning_sats=10)

    assert taxa_saque_sats(corretora, Rede.ONCHAIN) == 20_000
    assert taxa_saque_sats(corretora, Rede.LIGHTNING) == 10
    assert taxa_saque_sats(Corretora(), Rede.LIGHTNING) is None


def test_valor_minimo_para_ficar_no_alvo():
    # Alvo 2%: sobra 0,5% pra taxa de saque de R$ 100 -> R$ 100 / 0,005 = R$ 20.000
    valor = valor_minimo_por_compra(Corretora(), PRECO, Rede.ONCHAIN, Decimal(2))

    assert valor == Decimal("20000.00")
    # Conferindo: com esse valor o custo fica exatamente no alvo
    custo = calcular_custo(Corretora(), valor, PRECO, Rede.ONCHAIN)
    assert custo.custo_pct == Decimal("2.000")


def test_valor_minimo_e_dividido_entre_as_compras_do_ciclo():
    valor = valor_minimo_por_compra(Corretora(), PRECO, Rede.ONCHAIN, Decimal(2), 4)

    assert valor == Decimal("5000.00")


@pytest.mark.parametrize("alvo", [Decimal("1.5"), Decimal(1)])
def test_valor_minimo_impossivel_quando_taxas_percentuais_passam_do_alvo(alvo):
    # Taxa + spread já somam 1,5%
    assert valor_minimo_por_compra(Corretora(), PRECO, Rede.ONCHAIN, alvo) is None


def test_valor_minimo_respeita_o_saque_minimo():
    # Taxa de saque zero, mas precisa comprar 1.000.000 sats (R$ 5000) líquidos
    corretora = Corretora(taxa_saque_onchain_sats=0, saque_minimo_sats=1_000_000)

    valor = valor_minimo_por_compra(corretora, PRECO, Rede.ONCHAIN, Decimal(2))

    # R$ 5000 / 0,985 = 5076,142... -> arredonda pra cima
    assert valor == Decimal("5076.15")


def test_ranquear_ordena_viaveis_pelo_custo_e_deixa_inviaveis_no_fim():
    cara = Corretora(id=1, nome="Cara", spread_pct=Decimal(3))
    barata = Corretora(id=2, nome="Barata", spread_pct=Decimal("0.2"))
    minimo_alto = Corretora(id=3, nome="Mínimo alto", saque_minimo_sats=10**8)

    ranking = ranquear([cara, minimo_alto, barata], Decimal(1000), PRECO, Rede.ONCHAIN)

    assert [c.corretora_nome for c in ranking] == ["Barata", "Cara", "Mínimo alto"]
    assert [c.viavel for c in ranking] == [True, True, False]


def test_ranquear_ignora_corretoras_inativas():
    ranking = ranquear(
        [Corretora(id=1, nome="Ativa"), Corretora(id=2, nome="Inativa", ativa=False)],
        Decimal(1000),
        PRECO,
        Rede.ONCHAIN,
    )

    assert [c.corretora_nome for c in ranking] == ["Ativa"]
