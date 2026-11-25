from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.api.dependencies import get_simulacao_service
from app.schemas.simulacao import Simulacao, SimulacaoCreate, SimulacaoPatch
from app.services.simulacao_service import (
    SemCorretorasAtivasError,
    SimulacaoNaoEncontradaError,
    SimulacaoService,
)

router = APIRouter(prefix="/simulacoes", tags=["simulacoes"])

ServiceDep = Annotated[SimulacaoService, Depends(get_simulacao_service)]
SimulacaoId = Annotated[int, Path(gt=0, description="ID da simulação")]


def _http(erro: Exception) -> HTTPException:
    if isinstance(erro, SimulacaoNaoEncontradaError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    # Pedido válido, mas não dá pra calcular sem corretora: 422
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(erro))


ERROS = (SimulacaoNaoEncontradaError, SemCorretorasAtivasError)


@router.get("", response_model=list[Simulacao])
def listar_simulacoes(service: ServiceDep):
    return service.listar()


@router.get("/{simulacao_id}", response_model=Simulacao)
def buscar_simulacao(simulacao_id: SimulacaoId, service: ServiceDep):
    try:
        return service.buscar(simulacao_id)
    except ERROS as erro:
        raise _http(erro) from erro


@router.post("", response_model=Simulacao, status_code=status.HTTP_201_CREATED)
def criar_simulacao(dados: SimulacaoCreate, service: ServiceDep):
    try:
        return service.criar(dados)
    except ERROS as erro:
        raise _http(erro) from erro


@router.patch("/{simulacao_id}", response_model=Simulacao)
def atualizar_simulacao(simulacao_id: SimulacaoId, dados: SimulacaoPatch, service: ServiceDep):
    try:
        return service.atualizar_parcial(simulacao_id, dados)
    except ERROS as erro:
        raise _http(erro) from erro


@router.delete("/{simulacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_simulacao(simulacao_id: SimulacaoId, service: ServiceDep):
    try:
        service.remover(simulacao_id)
    except ERROS as erro:
        raise _http(erro) from erro
