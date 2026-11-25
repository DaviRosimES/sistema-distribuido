import { Trash2 } from "lucide-react";
import { useState } from "react";
import { botao, botaoPerigo } from "../ui";

// Remover apaga do banco sem volta, então o primeiro clique só pede confirmação.
// A confirmação fica na própria linha (e não num window.confirm), assim dá pra ver o que
// vai ser apagado e cancelar sem sair do contexto.
export function BotaoRemover({ onConfirmar, disabled, className = "" }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={disabled}
        className={`${botaoPerigo} ${className}`}
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        Remover
      </button>
    );
  }

  return (
    <fieldset
      className={`m-0 inline-flex min-w-0 flex-wrap items-center gap-2 border-0 p-0 ${className}`}
    >
      <legend className="sr-only">Confirmar remoção</legend>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Remover de vez?
      </span>
      <button
        type="button"
        onClick={async () => {
          await onConfirmar();
          setConfirmando(false);
        }}
        disabled={disabled}
        className={`${botaoPerigo} border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40`}
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        Confirmar remoção
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        disabled={disabled}
        className={botao}
      >
        Cancelar
      </button>
    </fieldset>
  );
}
