"""Regras de cálculo do custo de comprar BTC numa corretora e sacar pra carteira própria.

São funções puras: recebem os números e devolvem o resultado, sem banco nem HTTP.
Assim dá pra testar cada regra isolada e reaproveitar no service de simulações.
"""

from dataclasses import dataclass
from decimal import ROUND_CEILING, ROUND_FLOOR, Decimal
from enum import StrEnum
from typing import Protocol

SATS_POR_BTC = Decimal(100_000_000)
CENTAVO = Decimal("0.01")
CEM = Decimal(100)


class Rede(StrEnum):
    ONCHAIN = "onchain"
    LIGHTNING = "lightning"


# Só os campos que o cálculo usa. Tanto o modelo do banco quanto um objeto de teste servem.
class TaxasCorretora(Protocol):
    id: int
    nome: str
    taxa_negociacao_pct: Decimal
    spread_pct: Decimal
    taxa_saque_onchain_sats: int
    saque_minimo_sats: int
    suporta_lightning: bool
    taxa_saque_lightning_sats: int | None
    ativa: bool


@dataclass(frozen=True)
class CustoCorretora:
    corretora_id: int
    corretora_nome: str
    viavel: bool
    motivo: str | None
    taxa_negociacao_brl: Decimal
    spread_brl: Decimal
    taxa_saque_sats: int | None
    taxa_saque_brl: Decimal
    sats_recebidos: int
    custo_total_brl: Decimal
    custo_pct: Decimal
    # Quanto custaria se sacasse a cada compra, pra mostrar a economia de juntar os saques
    economia_brl: Decimal
    # Menor valor por compra pra que o custo fique no alvo (None = impossível nessa corretora)
    valor_minimo_brl: Decimal | None


def _centavos(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO)


def _sats_para_brl(sats: int | Decimal, preco_btc_brl: Decimal) -> Decimal:
    return Decimal(sats) * preco_btc_brl / SATS_POR_BTC


def taxa_saque_sats(corretora: TaxasCorretora, rede: Rede) -> int | None:
    """Taxa de saque fixa na rede escolhida, ou None se a corretora não saca por ela."""
    if rede is Rede.ONCHAIN:
        return corretora.taxa_saque_onchain_sats
    if not corretora.suporta_lightning:
        return None
    return corretora.taxa_saque_lightning_sats


def _custo_ciclo(
    corretora: TaxasCorretora, valor_brl: Decimal, preco_btc_brl: Decimal, taxa_saque: int
) -> tuple[Decimal, Decimal, int, int]:
    """Compra `valor_brl` e saca tudo de uma vez.

    Devolve (taxa de negociação, spread, sats comprados, sats recebidos na carteira).
    """
    taxa_negociacao = valor_brl * corretora.taxa_negociacao_pct / CEM
    spread = valor_brl * corretora.spread_pct / CEM
    liquido = valor_brl - taxa_negociacao - spread
    # A corretora credita sats inteiros, então arredondo pra baixo
    sats_comprados = int((liquido / preco_btc_brl * SATS_POR_BTC).to_integral_value(ROUND_FLOOR))
    return taxa_negociacao, spread, sats_comprados, sats_comprados - taxa_saque


def valor_minimo_por_compra(
    corretora: TaxasCorretora,
    preco_btc_brl: Decimal,
    rede: Rede,
    custo_alvo_pct: Decimal,
    compras_por_saque: int = 1,
) -> Decimal | None:
    """Menor valor por compra (em R$) pra que o custo total fique em até `custo_alvo_pct`.

    O custo em % é: taxa% + spread% + taxa_saque_brl / valor_do_ciclo.
    A parte percentual não muda com o valor, só a taxa de saque (fixa) vai se diluindo.
    Então: valor_do_ciclo >= taxa_saque_brl / (alvo% - taxa% - spread%).
    Também precisa comprar pelo menos o saque mínimo da corretora.
    """
    taxa_saque = taxa_saque_sats(corretora, rede)
    if taxa_saque is None:
        return None

    percentual = (corretora.taxa_negociacao_pct + corretora.spread_pct) / CEM
    folga = custo_alvo_pct / CEM - percentual
    if folga <= 0:
        # Só as taxas percentuais já passam do alvo: nenhum valor resolve
        return None

    pelo_custo = _sats_para_brl(taxa_saque, preco_btc_brl) / folga
    pelo_minimo = _sats_para_brl(corretora.saque_minimo_sats, preco_btc_brl) / (1 - percentual)
    valor_ciclo = max(pelo_custo, pelo_minimo)
    # Arredondo pra cima, senão o valor sugerido ficaria um centavo abaixo do alvo
    return (valor_ciclo / compras_por_saque).quantize(CENTAVO, rounding=ROUND_CEILING)


def calcular_custo(
    corretora: TaxasCorretora,
    valor_brl: Decimal,
    preco_btc_brl: Decimal,
    rede: Rede,
    compras_por_saque: int = 1,
    custo_alvo_pct: Decimal = Decimal(1),
) -> CustoCorretora:
    """Custo de fazer `compras_por_saque` compras de `valor_brl` e sacar tudo uma vez só."""
    valor_ciclo = valor_brl * compras_por_saque
    taxa_saque = taxa_saque_sats(corretora, rede)
    valor_minimo = valor_minimo_por_compra(
        corretora, preco_btc_brl, rede, custo_alvo_pct, compras_por_saque
    )

    def inviavel(motivo: str, taxa_negociacao=Decimal(0), spread=Decimal(0)) -> CustoCorretora:
        return CustoCorretora(
            corretora_id=corretora.id,
            corretora_nome=corretora.nome,
            viavel=False,
            motivo=motivo,
            taxa_negociacao_brl=_centavos(taxa_negociacao),
            spread_brl=_centavos(spread),
            taxa_saque_sats=taxa_saque,
            taxa_saque_brl=_centavos(_sats_para_brl(taxa_saque or 0, preco_btc_brl)),
            sats_recebidos=0,
            custo_total_brl=_centavos(valor_ciclo),
            custo_pct=CEM,
            economia_brl=Decimal("0.00"),
            valor_minimo_brl=valor_minimo,
        )

    if taxa_saque is None:
        return inviavel("Não faz saque pela Lightning")

    taxa_negociacao, spread, sats_comprados, sats_recebidos = _custo_ciclo(
        corretora, valor_ciclo, preco_btc_brl, taxa_saque
    )
    if sats_comprados < corretora.saque_minimo_sats:
        return inviavel(
            f"Compra abaixo do saque mínimo de {corretora.saque_minimo_sats} sats",
            taxa_negociacao,
            spread,
        )
    if sats_recebidos <= 0:
        return inviavel("A taxa de saque é maior que o valor comprado", taxa_negociacao, spread)

    custo_total = valor_ciclo - _sats_para_brl(sats_recebidos, preco_btc_brl)

    # Economia de juntar os saques: o mesmo valor sacando a cada compra pagaria a taxa N vezes
    economia = Decimal(0)
    if compras_por_saque > 1:
        *_, sats_uma_compra = _custo_ciclo(corretora, valor_brl, preco_btc_brl, taxa_saque)
        custo_sacando_sempre = (
            valor_brl - _sats_para_brl(sats_uma_compra, preco_btc_brl)
        ) * compras_por_saque
        economia = max(custo_sacando_sempre - custo_total, Decimal(0))

    return CustoCorretora(
        corretora_id=corretora.id,
        corretora_nome=corretora.nome,
        viavel=True,
        motivo=None,
        taxa_negociacao_brl=_centavos(taxa_negociacao),
        spread_brl=_centavos(spread),
        taxa_saque_sats=taxa_saque,
        taxa_saque_brl=_centavos(_sats_para_brl(taxa_saque, preco_btc_brl)),
        sats_recebidos=sats_recebidos,
        custo_total_brl=_centavos(custo_total),
        custo_pct=(custo_total / valor_ciclo * CEM).quantize(Decimal("0.001")),
        economia_brl=_centavos(economia),
        valor_minimo_brl=valor_minimo,
    )


def ranquear(
    corretoras: list[TaxasCorretora],
    valor_brl: Decimal,
    preco_btc_brl: Decimal,
    rede: Rede,
    compras_por_saque: int = 1,
    custo_alvo_pct: Decimal = Decimal(1),
) -> list[CustoCorretora]:
    """Custo em cada corretora ativa: viáveis primeiro, da mais barata pra mais cara."""
    custos = [
        calcular_custo(c, valor_brl, preco_btc_brl, rede, compras_por_saque, custo_alvo_pct)
        for c in corretoras
        if c.ativa
    ]
    # sorted é estável: empate no custo mantém a ordem de entrada (alfabética)
    return sorted(custos, key=lambda custo: (not custo.viavel, custo.custo_total_brl))
