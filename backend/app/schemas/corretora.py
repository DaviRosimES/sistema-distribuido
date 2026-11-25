from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

# Percentual entre 0% e 10% com até 3 casas (ex.: 0.125 = 0,125%).
# Internamente é Decimal pra não perder precisão, mas no JSON sai como número
# (o padrão do Pydantic seria string, o que obrigaria o frontend a converter).
Percentual = Annotated[
    Decimal,
    Field(ge=0, le=10, max_digits=6, decimal_places=3),
    PlainSerializer(float, return_type=float, when_used="json"),
]

# 1 BTC = 100.000.000 sats. Nenhuma taxa de saque real chega perto de 0,1 BTC,
# então esse limite só barra valor digitado errado.
Sats = Annotated[int, Field(ge=0, le=10_000_000)]


# "  Binance " e "Binance" são a mesma corretora, então tiro os espaços das pontas
def _limpar_nome(valor: str) -> str:
    valor = valor.strip()
    if not valor:
        raise ValueError("não pode ser vazio")
    return valor


class CorretoraBase(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    taxa_negociacao_pct: Percentual
    spread_pct: Percentual
    taxa_saque_onchain_sats: Sats
    saque_minimo_sats: Annotated[int, Field(ge=0, le=100_000_000)] = 0
    suporta_lightning: bool = False
    taxa_saque_lightning_sats: Sats | None = None
    ativa: bool = True
    observacoes: str | None = Field(default=None, max_length=500)

    @field_validator("nome")
    @classmethod
    def limpa_nome(cls, valor: str) -> str:
        return _limpar_nome(valor)


class CorretoraCreate(CorretoraBase):
    pass


# O PUT substitui a corretora inteira, então usa os mesmos campos do create
class CorretoraUpdate(CorretoraBase):
    pass


# O PATCH atualiza só o que vier no body, por isso tudo é opcional
class CorretoraPatch(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=60)
    taxa_negociacao_pct: Percentual | None = None
    spread_pct: Percentual | None = None
    taxa_saque_onchain_sats: Sats | None = None
    saque_minimo_sats: Annotated[int, Field(ge=0, le=100_000_000)] | None = None
    suporta_lightning: bool | None = None
    taxa_saque_lightning_sats: Sats | None = None
    ativa: bool | None = None
    observacoes: str | None = Field(default=None, max_length=500)

    # Omitir o campo pode, mas mandar null num campo obrigatório não.
    # A taxa Lightning e as observações podem ser null de propósito (pra limpar o valor).
    @field_validator(
        "nome",
        "taxa_negociacao_pct",
        "spread_pct",
        "taxa_saque_onchain_sats",
        "saque_minimo_sats",
        "suporta_lightning",
        "ativa",
    )
    @classmethod
    def nao_aceita_nulo(cls, valor):
        if valor is None:
            raise ValueError("não pode ser nulo")
        return valor

    @field_validator("nome")
    @classmethod
    def limpa_nome(cls, valor: str) -> str:
        return _limpar_nome(valor)


class Corretora(CorretoraBase):
    # from_attributes deixa o FastAPI montar a resposta direto a partir do modelo ORM
    model_config = ConfigDict(from_attributes=True)

    id: int
