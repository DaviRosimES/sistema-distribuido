from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer

from app.core.moeda import Moeda


class Cotacao(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    moeda: Moeda

    preco_btc: Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
    fonte: str
    consultada_em: datetime
