from app.models.tarefa import TarefaModel


class FakeTarefaRepository:
    # Repositório em memória só pros testes unitários do service, assim eles não dependem de banco
    def __init__(self):
        self.tarefas: dict[int, TarefaModel] = {}
        self._proximo_id = 1

    def listar(self, concluida: bool | None = None) -> list[TarefaModel]:
        tarefas = sorted(self.tarefas.values(), key=lambda tarefa: tarefa.id)
        if concluida is None:
            return tarefas
        return [tarefa for tarefa in tarefas if tarefa.concluida == concluida]

    def buscar(self, tarefa_id: int) -> TarefaModel | None:
        return self.tarefas.get(tarefa_id)

    def buscar_por_titulo(self, titulo: str) -> TarefaModel | None:
        return next((t for t in self.tarefas.values() if t.titulo == titulo), None)

    def salvar(self, tarefa: TarefaModel) -> TarefaModel:
        if tarefa.id is None:
            tarefa.id = self._proximo_id
            self._proximo_id += 1
        self.tarefas[tarefa.id] = tarefa
        return tarefa

    def remover(self, tarefa: TarefaModel) -> None:
        del self.tarefas[tarefa.id]
