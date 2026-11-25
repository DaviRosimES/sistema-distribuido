from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, computed_field, field_validator

from app.services.calculadora import Rede

# No JSON os valores em Decimal saem como número (o padrão do Pydantic seria string)
ComoNumero = PlainSerializer(float, return_type=float, when_used="json")

Valor = Annotated[Decimal, Field(gt=0, le=100_000_000, decimal_places=2), ComoNumero]
PrecoBtc = Annotated[Decimal, Field(gt=0, le=100_000_000, decimal_places=2), ComoNumero]
# Alvo de custo: acima de 0% e até 100%
AlvoPct = Annotated[Decimal, Field(gt=0, le=100, decimal_places=3), ComoNumero]
# De 1 (saca a cada compra) até 52 (compra toda semana e saca uma vez por ano)
ComprasPorSaque = Annotated[int, Field(ge=1, le=52)]


class SimulacaoCreate(BaseModel):
    descricao: str | None = Field(default=None, max_length=100)
    valor: Valor
    preco_btc: PrecoBtc
    rede: Rede = Rede.ONCHAIN
    compras_por_saque: ComprasPorSaque = 1
    custo_alvo_pct: AlvoPct = Decimal(1)


# O PATCH aceita trocar a descrição ou os parâmetros; mudando parâmetro, o ranking é recalculado
class SimulacaoPatch(BaseModel):
    descricao: str | None = Field(default=None, max_length=100)
    valor: Valor | None = None
    preco_btc: PrecoBtc | None = None
    rede: Rede | None = None
    compras_por_saque: ComprasPorSaque | None = None
    custo_alvo_pct: AlvoPct | None = None

    # A descrição pode ser null (pra apagar), os parâmetros do cálculo não
    @field_validator("valor", "preco_btc", "rede", "compras_por_saque", "custo_alvo_pct")
    @classmethod
    def nao_aceita_nulo(cls, valor):
        if valor is None:
            raise ValueError("não pode ser nulo")
        return valor


class ItemRanking(BaseModel):
    # Lido direto do dataclass CustoCorretora da calculadora
    model_config = ConfigDict(from_attributes=True)

    corretora_id: int
    corretora_nome: str
    viavel: bool
    motivo: str | None
    taxa_negociacao: Annotated[Decimal, ComoNumero]
    spread: Annotated[Decimal, ComoNumero]
    taxa_saque_sats: int | None
    taxa_saque: Annotated[Decimal, ComoNumero]
    sats_recebidos: int
    custo_total: Annotated[Decimal, ComoNumero]
    custo_pct: Annotated[Decimal, ComoNumero]
    economia: Annotated[Decimal, ComoNumero]
    valor_minimo: Annotated[Decimal, ComoNumero] | None


class Simulacao(SimulacaoCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    criada_em: datetime
    ranking: list[ItemRanking]

    # A mais barata entre as viáveis (o ranking já vem ordenado); None se nenhuma der certo
    @computed_field
    @property
    def melhor_corretora(self) -> str | None:
        return next((item.corretora_nome for item in self.ranking if item.viavel), None)
