from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.dependencies import get_corretora_service
from app.schemas.corretora import Corretora, CorretoraCreate, CorretoraPatch, CorretoraUpdate
from app.services.corretora_service import (
    CorretoraDuplicadaError,
    CorretoraInvalidaError,
    CorretoraNaoEncontradaError,
    CorretoraService,
)

router = APIRouter(prefix="/corretoras", tags=["corretoras"])

ServiceDep = Annotated[CorretoraService, Depends(get_corretora_service)]
CorretoraId = Annotated[int, Path(gt=0, description="ID da corretora")]


# Cada erro do service vira um status HTTP; o service não sabe nada de HTTP
def _http(erro: Exception) -> HTTPException:
    if isinstance(erro, CorretoraNaoEncontradaError):
        codigo = status.HTTP_404_NOT_FOUND
    elif isinstance(erro, CorretoraDuplicadaError):
        codigo = status.HTTP_409_CONFLICT
    else:
        codigo = status.HTTP_422_UNPROCESSABLE_CONTENT
    return HTTPException(status_code=codigo, detail=str(erro))


ERROS = (CorretoraNaoEncontradaError, CorretoraDuplicadaError, CorretoraInvalidaError)


@router.get("", response_model=list[Corretora])
def listar_corretoras(
    service: ServiceDep,
    ativa: Annotated[bool | None, Query(description="Filtra pelas corretoras ativas")] = None,
):
    return service.listar(ativa)


@router.get("/{corretora_id}", response_model=Corretora)
def buscar_corretora(corretora_id: CorretoraId, service: ServiceDep):
    try:
        return service.buscar(corretora_id)
    except ERROS as erro:
        raise _http(erro) from erro


@router.post("", response_model=Corretora, status_code=status.HTTP_201_CREATED)
def criar_corretora(dados: CorretoraCreate, service: ServiceDep):
    try:
        return service.criar(dados)
    except ERROS as erro:
        raise _http(erro) from erro


@router.put("/{corretora_id}", response_model=Corretora)
def substituir_corretora(corretora_id: CorretoraId, dados: CorretoraUpdate, service: ServiceDep):
    try:
        return service.substituir(corretora_id, dados)
    except ERROS as erro:
        raise _http(erro) from erro


@router.patch("/{corretora_id}", response_model=Corretora)
def atualizar_corretora(corretora_id: CorretoraId, dados: CorretoraPatch, service: ServiceDep):
    try:
        return service.atualizar_parcial(corretora_id, dados)
    except ERROS as erro:
        raise _http(erro) from erro


@router.delete("/{corretora_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_corretora(corretora_id: CorretoraId, service: ServiceDep):
    try:
        service.remover(corretora_id)
    except ERROS as erro:
        raise _http(erro) from erro
