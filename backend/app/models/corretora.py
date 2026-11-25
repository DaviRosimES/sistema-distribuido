from decimal import Decimal

from sqlalchemy import BigInteger, Numeric, String, UniqueConstraint, false, true
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


# Uma corretora (exchange) com as taxas que ela cobra pra comprar BTC e sacar pra carteira própria.
# Percentuais ficam em Numeric (nunca float) porque é dinheiro: 0.1 + 0.2 tem que dar 0.3.
# As taxas de saque ficam em satoshis (1 BTC = 100.000.000 sats), que é como as corretoras divulgam.
class CorretoraModel(Base):
    __tablename__ = "corretoras"
    __table_args__ = (UniqueConstraint("nome", name="uq_corretoras_nome"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(60))
    taxa_negociacao_pct: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    spread_pct: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    taxa_saque_onchain_sats: Mapped[int] = mapped_column(BigInteger)
    saque_minimo_sats: Mapped[int] = mapped_column(BigInteger)
    suporta_lightning: Mapped[bool] = mapped_column(default=False, server_default=false())
    taxa_saque_lightning_sats: Mapped[int | None] = mapped_column(BigInteger)
    ativa: Mapped[bool] = mapped_column(default=True, server_default=true())
    observacoes: Mapped[str | None] = mapped_column(String(500))
