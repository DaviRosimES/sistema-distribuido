from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import JSON, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


# Uma simulação guarda o que o usuário pediu (valor, preço, rede...) e o ranking calculado.
# O ranking é uma "foto" do momento: se as taxas de uma corretora mudarem depois, a simulação
# antiga continua mostrando o resultado que deu naquele dia. Por isso ele fica num JSON e não
# numa chave estrangeira pra corretora (apagar a corretora também não apaga a simulação).
class SimulacaoModel(Base):
    __tablename__ = "simulacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    descricao: Mapped[str | None] = mapped_column(String(100))
    valor: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    preco_btc: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    rede: Mapped[str] = mapped_column(String(10))
    compras_por_saque: Mapped[int]
    custo_alvo_pct: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    ranking: Mapped[list[dict[str, Any]]] = mapped_column(JSON)
    criada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
