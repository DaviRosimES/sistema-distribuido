import { TarefaItem } from "./TarefaItem";

export function TarefaList({
  tarefas,
  onAlternarConcluida,
  onEditar,
  onRemover,
}) {
  if (tarefas.length === 0) {
    return <p className="text-slate-600">Nenhuma tarefa cadastrada.</p>;
  }

  return (
    <ul className="space-y-2">
      {tarefas.map((tarefa) => (
        <TarefaItem
          key={tarefa.id}
          tarefa={tarefa}
          onAlternarConcluida={onAlternarConcluida}
          onEditar={onEditar}
          onRemover={onRemover}
        />
      ))}
    </ul>
  );
}
