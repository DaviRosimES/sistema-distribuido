"""Cadastra corretoras reais com as taxas pesquisadas em 25/11/2026.

As corretoras não publicam a taxa de saque nem o spread numa API aberta, então os valores
foram levantados à mão. Cada corretora diz nas observações o que é oficial e o que é
estimativa. Taxa muda: antes de decidir, confira no app da corretora e edite pela tela.

Roda com `make seed` (local) ou `make docker-seed` (dentro do container). Pode rodar mais de
uma vez: quem já existe é só pulado.
"""

from decimal import Decimal

from app.database.session import SessionLocal
from app.repositories.corretora_repository import CorretoraRepository
from app.schemas.corretora import CorretoraCreate
from app.services.corretora_service import CorretoraDuplicadaError, CorretoraService

# Taxa de negociação = taxa "taker", que é a cobrada numa compra a mercado.
# Spread: nas três o BTC é comprado no livro de ofertas, então o spread é pequeno, mas
# nenhuma delas publica esse valor; usei uma estimativa conservadora.
CORRETORAS = [
    CorretoraCreate(
        nome="Binance",
        taxa_negociacao_pct=Decimal("0.1"),
        spread_pct=Decimal("0.1"),
        taxa_saque_onchain_sats=3_000,
        suporta_lightning=True,
        taxa_saque_lightning_sats=100,
        observacoes=(
            "Consulta em 25/11/2026. Taxa de negociação oficial (binance.com/en/fee/schedule, "
            "usuário regular). Saques on-chain e Lightning estimados por fontes de terceiros "
            "(a tabela oficial varia com a rede). Spread estimado. Confira no app."
        ),
    ),
    CorretoraCreate(
        nome="Bitso",
        taxa_negociacao_pct=Decimal("0.4"),
        spread_pct=Decimal("0.2"),
        taxa_saque_onchain_sats=1_543,
        suporta_lightning=True,
        taxa_saque_lightning_sats=0,
        observacoes=(
            "Consulta em 25/11/2026. Taxa de negociação (taker, menor faixa) e saques "
            "oficiais (bitso.com/br/fees e bitso.com/br/fees/transactions): on-chain "
            "0,00001543 BTC, Lightning sem taxa. Spread estimado. Confira no app."
        ),
    ),
    CorretoraCreate(
        nome="Foxbit",
        taxa_negociacao_pct=Decimal("0.5"),
        spread_pct=Decimal("0.2"),
        taxa_saque_onchain_sats=40_000,
        observacoes=(
            "Consulta em 25/11/2026. Taxa de negociação oficial (foxbit.com.br/taxas, taker "
            "nível Iniciante). Saque on-chain de 0,0004 BTC segundo fontes antigas de "
            "terceiros; saque Lightning não confirmado. Spread estimado. Confira no app."
        ),
    ),
]


def main() -> None:
    with SessionLocal() as db:
        service = CorretoraService(CorretoraRepository(db))
        for corretora in CORRETORAS:
            try:
                service.criar(corretora)
                print(f"Cadastrada: {corretora.nome}")
            except CorretoraDuplicadaError:
                print(f"Já existia: {corretora.nome}")


if __name__ == "__main__":
    main()
