from app.schemas.tarefa import Tarefa


class TarefaRepository:
    # Por enquanto os dados ficam em memória, depois dá pra trocar pelo Postgres sem mexer nas outras camadas
    def __init__(self):
        self._tarefas: dict[int, Tarefa] = {}
        self._proximo_id = 1

    def listar(self) -> list[Tarefa]:
        return list(self._tarefas.values())

    def buscar(self, tarefa_id: int) -> Tarefa | None:
        return self._tarefas.get(tarefa_id)

    def criar(self, dados: dict) -> Tarefa:
        tarefa = Tarefa(id=self._proximo_id, **dados)
        self._tarefas[tarefa.id] = tarefa
        self._proximo_id += 1
        return tarefa

    def salvar(self, tarefa: Tarefa) -> Tarefa:
        self._tarefas[tarefa.id] = tarefa
        return tarefa

    def remover(self, tarefa_id: int) -> bool:
        return self._tarefas.pop(tarefa_id, None) is not None
