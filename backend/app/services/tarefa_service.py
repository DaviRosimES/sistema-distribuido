from app.repositories.tarefa_repository import TarefaRepository
from app.schemas.tarefa import Tarefa, TarefaCreate, TarefaPatch, TarefaUpdate


class TarefaNaoEncontradaError(Exception):
    def __init__(self, tarefa_id: int):
        super().__init__(f"Tarefa {tarefa_id} não encontrada")
        self.tarefa_id = tarefa_id


class TarefaService:
    def __init__(self, repository: TarefaRepository):
        self.repository = repository

    def listar(self, concluida: bool | None = None) -> list[Tarefa]:
        tarefas = self.repository.listar()
        if concluida is None:
            return tarefas
        return [tarefa for tarefa in tarefas if tarefa.concluida == concluida]

    def buscar(self, tarefa_id: int) -> Tarefa:
        tarefa = self.repository.buscar(tarefa_id)
        if tarefa is None:
            raise TarefaNaoEncontradaError(tarefa_id)
        return tarefa

    def criar(self, dados: TarefaCreate) -> Tarefa:
        return self.repository.criar(dados.model_dump())

    def substituir(self, tarefa_id: int, dados: TarefaUpdate) -> Tarefa:
        self.buscar(tarefa_id)
        return self.repository.salvar(Tarefa(id=tarefa_id, **dados.model_dump()))

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaPatch) -> Tarefa:
        tarefa = self.buscar(tarefa_id)
        # exclude_unset garante que só os campos enviados no body sejam alterados
        alteracoes = dados.model_dump(exclude_unset=True)
        return self.repository.salvar(tarefa.model_copy(update=alteracoes))

    def remover(self, tarefa_id: int) -> None:
        if not self.repository.remover(tarefa_id):
            raise TarefaNaoEncontradaError(tarefa_id)
