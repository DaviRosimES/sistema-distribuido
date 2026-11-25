from typing import Any, Protocol

from app.models.corretora import CorretoraModel
from app.models.simulacao import SimulacaoModel
from app.repositories.simulacao_repository import SimulacaoRepository
from app.schemas.simulacao import ItemRanking, SimulacaoCreate, SimulacaoPatch
from app.services.calculadora import Rede, ranquear

# Mudar qualquer um desses campos muda o resultado, então o ranking precisa ser refeito
CAMPOS_DO_CALCULO = {"valor", "preco_btc", "rede", "compras_por_saque", "custo_alvo_pct"}


class SimulacaoNaoEncontradaError(Exception):
    def __init__(self, simulacao_id: int):
        super().__init__(f"Simulação {simulacao_id} não encontrada")
        self.simulacao_id = simulacao_id


class SemCorretorasAtivasError(Exception):
    def __init__(self):
        super().__init__("Cadastre pelo menos uma corretora ativa antes de simular")


# O service de simulações só precisa listar as corretoras, então depende só disso
class FonteDeCorretoras(Protocol):
    def listar(self, ativa: bool | None = None) -> list[CorretoraModel]: ...


class SimulacaoService:
    def __init__(self, repository: SimulacaoRepository, corretoras: FonteDeCorretoras):
        self.repository = repository
        self.corretoras = corretoras

    def listar(self) -> list[SimulacaoModel]:
        return self.repository.listar()

    def buscar(self, simulacao_id: int) -> SimulacaoModel:
        simulacao = self.repository.buscar(simulacao_id)
        if simulacao is None:
            raise SimulacaoNaoEncontradaError(simulacao_id)
        return simulacao

    def criar(self, dados: SimulacaoCreate) -> SimulacaoModel:
        simulacao = SimulacaoModel(**dados.model_dump())
        simulacao.ranking = self._calcular_ranking(simulacao)
        return self.repository.salvar(simulacao)

    def atualizar_parcial(self, simulacao_id: int, dados: SimulacaoPatch) -> SimulacaoModel:
        simulacao = self.buscar(simulacao_id)
        alteracoes = dados.model_dump(exclude_unset=True)
        for campo, valor in alteracoes.items():
            setattr(simulacao, campo, valor)
        # Só a descrição mudou: mantém a foto antiga do ranking.
        # Mudou parâmetro: recalcula com as taxas atuais das corretoras.
        if CAMPOS_DO_CALCULO & alteracoes.keys():
            simulacao.ranking = self._calcular_ranking(simulacao)
        return self.repository.salvar(simulacao)

    def remover(self, simulacao_id: int) -> None:
        self.repository.remover(self.buscar(simulacao_id))

    def _calcular_ranking(self, simulacao: SimulacaoModel) -> list[dict[str, Any]]:
        corretoras = self.corretoras.listar(ativa=True)
        if not corretoras:
            raise SemCorretorasAtivasError()
        ranking = ranquear(
            corretoras,
            simulacao.valor,
            simulacao.preco_btc,
            Rede(simulacao.rede),
            simulacao.compras_por_saque,
            simulacao.custo_alvo_pct,
        )
        # A coluna é JSON, então guardo já no formato que a API devolve (números, não Decimal)
        return [ItemRanking.model_validate(item).model_dump(mode="json") for item in ranking]
