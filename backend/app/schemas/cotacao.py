from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer


class Cotacao(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    preco_btc: Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
    fonte: str
    consultada_em: datetime
