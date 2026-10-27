from typing import Annotated

from fastapi import Depends

from app.repositories.tarefa_repository import TarefaRepository
from app.services.tarefa_service import TarefaService

# Uma instância só pra aplicação inteira, senão cada requisição teria um repositório vazio
_tarefa_repository = TarefaRepository()


def get_tarefa_repository() -> TarefaRepository:
    return _tarefa_repository


# O repositório entra via Depends pra dar pra trocar ele nos testes com dependency_overrides
def get_tarefa_service(
    repository: Annotated[TarefaRepository, Depends(get_tarefa_repository)],
) -> TarefaService:
    return TarefaService(repository)
