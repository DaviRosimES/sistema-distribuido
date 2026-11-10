from typing import Any

from app.models.tarefa import TarefaModel
from app.repositories.tarefa_repository import TarefaRepository
from app.schemas.tarefa import TarefaCreate, TarefaPatch, TarefaUpdate


class TarefaNaoEncontradaError(Exception):
    def __init__(self, tarefa_id: int):
        super().__init__(f"Tarefa {tarefa_id} não encontrada")
        self.tarefa_id = tarefa_id


class TarefaDuplicadaError(Exception):
    def __init__(self, titulo: str):
        super().__init__("Já existe uma tarefa com esse título")
        self.titulo = titulo


class TarefaService:
    def __init__(self, repository: TarefaRepository):
        self.repository = repository

    def listar(self, concluida: bool | None = None) -> list[TarefaModel]:
        return self.repository.listar(concluida)

    def buscar(self, tarefa_id: int) -> TarefaModel:
        tarefa = self.repository.buscar(tarefa_id)
        if tarefa is None:
            raise TarefaNaoEncontradaError(tarefa_id)
        return tarefa

    def criar(self, dados: TarefaCreate) -> TarefaModel:
        self._garantir_titulo_livre(dados.titulo)
        # É aqui que o schema da API vira o modelo do banco
        return self.repository.salvar(TarefaModel(**dados.model_dump()))

    def substituir(self, tarefa_id: int, dados: TarefaUpdate) -> TarefaModel:
        tarefa = self.buscar(tarefa_id)
        return self._aplicar(tarefa, dados.model_dump())

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaPatch) -> TarefaModel:
        tarefa = self.buscar(tarefa_id)
        # exclude_unset garante que só os campos enviados no body sejam alterados
        return self._aplicar(tarefa, dados.model_dump(exclude_unset=True))

    def remover(self, tarefa_id: int) -> None:
        self.repository.remover(self.buscar(tarefa_id))

    def _aplicar(self, tarefa: TarefaModel, alteracoes: dict[str, Any]) -> TarefaModel:
        if "titulo" in alteracoes:
            self._garantir_titulo_livre(alteracoes["titulo"], tarefa.id)
        for campo, valor in alteracoes.items():
            setattr(tarefa, campo, valor)
        return self.repository.salvar(tarefa)

    def _garantir_titulo_livre(self, titulo: str, tarefa_id: int | None = None) -> None:
        # A própria tarefa pode manter o título dela; o erro é só quando outra já usa
        existente = self.repository.buscar_por_titulo(titulo)
        if existente is not None and existente.id != tarefa_id:
            raise TarefaDuplicadaError(titulo)
