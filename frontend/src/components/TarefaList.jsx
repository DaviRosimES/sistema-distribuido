export function TarefaList({ tarefas }) {
  if (tarefas.length === 0) {
    return <p className="text-slate-600">Nenhuma tarefa cadastrada.</p>;
  }

  return (
    <ul className="space-y-2">
      {tarefas.map((tarefa) => (
        <li
          key={tarefa.id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="font-medium break-words">{tarefa.titulo}</p>
          {tarefa.descricao && (
            <p className="text-sm text-slate-600 break-words">
              {tarefa.descricao}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
