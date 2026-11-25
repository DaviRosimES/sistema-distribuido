from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_cotacao_service
from app.schemas.cotacao import Cotacao
from app.services.cotacao_service import CotacaoIndisponivelError, CotacaoService

router = APIRouter(prefix="/cotacao", tags=["cotacao"])


# O frontend chama a nossa API, e a nossa API chama as fontes externas. Assim o navegador não
# depende de CORS de terceiros e dá pra trocar de fonte sem mexer no frontend.
@router.get("", response_model=Cotacao)
def obter_cotacao(service: Annotated[CotacaoService, Depends(get_cotacao_service)]):
    try:
        return service.obter()
    except CotacaoIndisponivelError as erro:
        # 503: o problema é num serviço do qual a API depende, não no pedido do cliente
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(erro)
        ) from erro
