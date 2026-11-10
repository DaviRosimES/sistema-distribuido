import { useId, useState } from "react";
import { TarefaForm } from "./TarefaForm";

export function TarefaItem({
  tarefa,
  onAlternarConcluida,
  onEditar,
  onRemover,
}) {
  const id = useId();
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Enquanto a API não responde, os controles ficam travados pra não mandar a ação duas vezes
  async function executar(acao) {
    setOcupado(true);
    try {
      await acao();
    } finally {
      setOcupado(false);
    }
  }

  if (editando) {
    return (
      <li>
        <TarefaForm
          valoresIniciais={tarefa}
          rotuloBotao="Salvar"
          limparAoSalvar={false}
          onCancelar={() => setEditando(false)}
          onSalvar={async (valores) => {
            // Se a API recusar, o erro sobe pro formulário e a edição continua aberta
            await onEditar(tarefa, valores);
            setEditando(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <input
          id={`${id}-concluida`}
          type="checkbox"
          checked={tarefa.concluida}
          disabled={ocupado}
          onChange={() => executar(() => onAlternarConcluida(tarefa))}
          className="mt-1 size-4 shrink-0"
        />
        <div className="min-w-0">
          <label
            htmlFor={`${id}-concluida`}
            className={`font-medium break-words ${tarefa.concluida ? "text-slate-500 line-through" : ""}`}
          >
            {tarefa.titulo}
          </label>
          {tarefa.descricao && (
            <p className="text-sm text-slate-600 break-words">
              {tarefa.descricao}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          disabled={ocupado}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => executar(() => onRemover(tarefa))}
          disabled={ocupado}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
