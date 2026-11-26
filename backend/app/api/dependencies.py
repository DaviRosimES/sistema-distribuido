from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends
from sqlalchemy.orm import Session

from app.clients.cotacao import Binance, CoinGecko
from app.core.config import COTACAO_CACHE_SEGUNDOS, COTACAO_TIMEOUT_SEGUNDOS
from app.database.session import get_db
from app.repositories.corretora_repository import CorretoraRepository
from app.repositories.simulacao_repository import SimulacaoRepository
from app.services.corretora_service import CorretoraService
from app.services.cotacao_service import CotacaoService
from app.services.simulacao_service import SimulacaoService


# A sessão vem do get_db, então cada requisição usa a sua própria sessão com o banco.
# Nos testes basta sobrescrever o get_db com dependency_overrides.
def get_corretora_repository(db: Annotated[Session, Depends(get_db)]) -> CorretoraRepository:
    return CorretoraRepository(db)


def get_corretora_service(
    repository: Annotated[CorretoraRepository, Depends(get_corretora_repository)],
) -> CorretoraService:
    return CorretoraService(repository)


def get_simulacao_service(
    db: Annotated[Session, Depends(get_db)],
    corretoras: Annotated[CorretoraRepository, Depends(get_corretora_repository)],
) -> SimulacaoService:
    return SimulacaoService(SimulacaoRepository(db), corretoras)


# Uma instância só pra aplicação inteira (lru_cache), senão o cache da cotação se perderia a
# cada requisição. O cliente HTTP também é reaproveitado entre as chamadas.
@lru_cache
def get_cotacao_service() -> CotacaoService:
    cliente = httpx.Client(timeout=COTACAO_TIMEOUT_SEGUNDOS)
    return CotacaoService(
        [Binance(cliente), CoinGecko(cliente)], cache_segundos=COTACAO_CACHE_SEGUNDOS
    )
