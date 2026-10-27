from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tarefa import TarefaModel


class TarefaRepository:
    # Só essa camada conhece o SQLAlchemy, o service e as rotas não sabem que existe um banco
    def __init__(self, db: Session):
        self.db = db

    def listar(self, concluida: bool | None = None) -> list[TarefaModel]:
        # O filtro vai pro WHERE em vez de filtrar em Python, assim o banco só devolve o necessário
        query = select(TarefaModel).order_by(TarefaModel.id)
        if concluida is not None:
            query = query.where(TarefaModel.concluida == concluida)
        return list(self.db.scalars(query))

    def buscar(self, tarefa_id: int) -> TarefaModel | None:
        return self.db.get(TarefaModel, tarefa_id)

    def salvar(self, tarefa: TarefaModel) -> TarefaModel:
        # Serve tanto pra criar quanto pra atualizar: o add numa tarefa que já existe não duplica
        self.db.add(tarefa)
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def remover(self, tarefa: TarefaModel) -> None:
        self.db.delete(tarefa)
        self.db.commit()
