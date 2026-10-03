from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.dependencies import get_tarefa_service
from app.schemas.tarefa import Tarefa, TarefaCreate, TarefaPatch, TarefaUpdate
from app.services.tarefa_service import TarefaNaoEncontradaError, TarefaService

router = APIRouter(prefix="/tarefas", tags=["tarefas"])

ServiceDep = Annotated[TarefaService, Depends(get_tarefa_service)]
TarefaId = Annotated[int, Path(gt=0, description="ID da tarefa")]


def _nao_encontrada(erro: TarefaNaoEncontradaError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.get("", response_model=list[Tarefa])
def listar_tarefas(
    service: ServiceDep,
    concluida: Annotated[bool | None, Query(description="Filtra pelo status da tarefa")] = None,
):
    return service.listar(concluida)


@router.get("/{tarefa_id}", response_model=Tarefa)
def buscar_tarefa(tarefa_id: TarefaId, service: ServiceDep):
    try:
        return service.buscar(tarefa_id)
    except TarefaNaoEncontradaError as erro:
        raise _nao_encontrada(erro)


@router.post("", response_model=Tarefa, status_code=status.HTTP_201_CREATED)
def criar_tarefa(dados: TarefaCreate, service: ServiceDep):
    return service.criar(dados)


@router.put("/{tarefa_id}", response_model=Tarefa)
def substituir_tarefa(tarefa_id: TarefaId, dados: TarefaUpdate, service: ServiceDep):
    try:
        return service.substituir(tarefa_id, dados)
    except TarefaNaoEncontradaError as erro:
        raise _nao_encontrada(erro)


@router.patch("/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(tarefa_id: TarefaId, dados: TarefaPatch, service: ServiceDep):
    try:
        return service.atualizar_parcial(tarefa_id, dados)
    except TarefaNaoEncontradaError as erro:
        raise _nao_encontrada(erro)


@router.delete("/{tarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_tarefa(tarefa_id: TarefaId, service: ServiceDep):
    try:
        service.remover(tarefa_id)
    except TarefaNaoEncontradaError as erro:
        raise _nao_encontrada(erro)
