from datetime import UTC, datetime

from app.models.corretora import CorretoraModel
from app.models.simulacao import SimulacaoModel


class FakeCorretoraRepository:
    # Repositório em memória pros testes unitários dos services, sem depender de banco
    def __init__(self):
        self.corretoras: dict[int, CorretoraModel] = {}
        self._proximo_id = 1

    def listar(self, ativa: bool | None = None) -> list[CorretoraModel]:
        corretoras = sorted(self.corretoras.values(), key=lambda corretora: corretora.nome)
        if ativa is None:
            return corretoras
        return [corretora for corretora in corretoras if corretora.ativa == ativa]

    def buscar(self, corretora_id: int) -> CorretoraModel | None:
        return self.corretoras.get(corretora_id)

    def buscar_por_nome(self, nome: str) -> CorretoraModel | None:
        return next(
            (c for c in self.corretoras.values() if c.nome.lower() == nome.lower()),
            None,
        )

    def salvar(self, corretora: CorretoraModel) -> CorretoraModel:
        if corretora.id is None:
            corretora.id = self._proximo_id
            self._proximo_id += 1
        self.corretoras[corretora.id] = corretora
        return corretora

    def remover(self, corretora: CorretoraModel) -> None:
        del self.corretoras[corretora.id]


class FakeSimulacaoRepository:
    def __init__(self):
        self.simulacoes: dict[int, SimulacaoModel] = {}
        self._proximo_id = 1

    def listar(self) -> list[SimulacaoModel]:
        return sorted(self.simulacoes.values(), key=lambda s: s.id, reverse=True)

    def buscar(self, simulacao_id: int) -> SimulacaoModel | None:
        return self.simulacoes.get(simulacao_id)

    def salvar(self, simulacao: SimulacaoModel) -> SimulacaoModel:
        if simulacao.id is None:
            simulacao.id = self._proximo_id
            simulacao.criada_em = datetime.now(UTC)
            self._proximo_id += 1
        self.simulacoes[simulacao.id] = simulacao
        return simulacao

    def remover(self, simulacao: SimulacaoModel) -> None:
        del self.simulacoes[simulacao.id]
