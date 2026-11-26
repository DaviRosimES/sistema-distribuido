from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.simulacao import SimulacaoModel


class SimulacaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> list[SimulacaoModel]:
        # Mais recentes primeiro; o id desempata simulações criadas no mesmo instante
        query = select(SimulacaoModel).order_by(
            SimulacaoModel.criada_em.desc(), SimulacaoModel.id.desc()
        )
        return list(self.db.scalars(query))

    def buscar(self, simulacao_id: int) -> SimulacaoModel | None:
        return self.db.get(SimulacaoModel, simulacao_id)

    def salvar(self, simulacao: SimulacaoModel) -> SimulacaoModel:
        self.db.add(simulacao)
        self.db.commit()
        self.db.refresh(simulacao)
        return simulacao

    def remover(self, simulacao: SimulacaoModel) -> None:
        self.db.delete(simulacao)
        self.db.commit()
