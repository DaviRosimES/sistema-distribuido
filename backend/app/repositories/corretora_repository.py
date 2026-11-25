from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.corretora import CorretoraModel


class CorretoraRepository:
    # Só essa camada conhece o SQLAlchemy, o service e as rotas não sabem que existe um banco
    def __init__(self, db: Session):
        self.db = db

    def listar(self, ativa: bool | None = None) -> list[CorretoraModel]:
        query = select(CorretoraModel).order_by(CorretoraModel.nome)
        if ativa is not None:
            query = query.where(CorretoraModel.ativa == ativa)
        return list(self.db.scalars(query))

    def buscar(self, corretora_id: int) -> CorretoraModel | None:
        return self.db.get(CorretoraModel, corretora_id)

    def buscar_por_nome(self, nome: str) -> CorretoraModel | None:
        # Compara sem diferenciar maiúsculas, pra "binance" e "Binance" contarem como a mesma
        query = select(CorretoraModel).where(func.lower(CorretoraModel.nome) == nome.lower())
        return self.db.scalar(query)

    def salvar(self, corretora: CorretoraModel) -> CorretoraModel:
        # Serve tanto pra criar quanto pra atualizar: o add numa corretora que já existe não duplica
        self.db.add(corretora)
        self.db.commit()
        self.db.refresh(corretora)
        return corretora

    def remover(self, corretora: CorretoraModel) -> None:
        self.db.delete(corretora)
        self.db.commit()
