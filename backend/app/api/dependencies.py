from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.tarefa_repository import TarefaRepository
from app.services.tarefa_service import TarefaService


# A sessão vem do get_db, então cada requisição usa a sua própria sessão com o banco.
# Nos testes basta sobrescrever o get_db com dependency_overrides.
def get_tarefa_repository(db: Annotated[Session, Depends(get_db)]) -> TarefaRepository:
    return TarefaRepository(db)


def get_tarefa_service(
    repository: Annotated[TarefaRepository, Depends(get_tarefa_repository)],
) -> TarefaService:
    return TarefaService(repository)
