"""Cadastra corretoras de exemplo pra facilitar a demonstração.

Os nomes e as taxas são fictícios (só pra ilustrar perfis diferentes de corretora);
pra comparar de verdade, edite pelos valores atuais que cada corretora divulga.
Roda com `make seed` (local) ou `make docker-seed` (dentro do container).
"""

from decimal import Decimal

from app.database.session import SessionLocal
from app.repositories.corretora_repository import CorretoraRepository
from app.schemas.corretora import CorretoraCreate
from app.services.corretora_service import CorretoraDuplicadaError, CorretoraService

EXEMPLOS = [
    CorretoraCreate(
        nome="Alfa Exchange (exemplo)",
        taxa_negociacao_pct=Decimal("0.1"),
        spread_pct=Decimal("0.5"),
        taxa_saque_onchain_sats=30_000,
        saque_minimo_sats=50_000,
        observacoes="Taxa baixa, mas saque on-chain caro e sem Lightning",
    ),
    CorretoraCreate(
        nome="Beta Bitcoin (exemplo)",
        taxa_negociacao_pct=Decimal("0.7"),
        spread_pct=Decimal("1.0"),
        taxa_saque_onchain_sats=5_000,
        suporta_lightning=True,
        taxa_saque_lightning_sats=0,
        observacoes="Spread alto, mas saque Lightning grátis",
    ),
    CorretoraCreate(
        nome="Gama Cripto (exemplo)",
        taxa_negociacao_pct=Decimal("0.35"),
        spread_pct=Decimal("0.8"),
        taxa_saque_onchain_sats=15_000,
        suporta_lightning=True,
        taxa_saque_lightning_sats=100,
    ),
    CorretoraCreate(
        nome="Delta Invest (exemplo)",
        taxa_negociacao_pct=Decimal("0.5"),
        spread_pct=Decimal("2.5"),
        taxa_saque_onchain_sats=0,
        saque_minimo_sats=100_000,
        observacoes="Saque grátis, mas embutido no spread",
    ),
]


def main() -> None:
    with SessionLocal() as db:
        service = CorretoraService(CorretoraRepository(db))
        for corretora in EXEMPLOS:
            # Pode rodar mais de uma vez: quem já existe é só pulado
            try:
                service.criar(corretora)
                print(f"Cadastrada: {corretora.nome}")
            except CorretoraDuplicadaError:
                print(f"Já existia: {corretora.nome}")


if __name__ == "__main__":
    main()
