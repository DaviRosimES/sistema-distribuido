import { rotulo as classeRotulo, entrada, textoAjuda } from "../ui";

// Rótulo + input + mensagem de ajuda/erro, ligados por id pra leitores de tela
export function Campo({ id, rotulo, erro, ajuda, className = "", ...props }) {
  const descricoes = [erro && `${id}-erro`, ajuda && `${id}-ajuda`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? "true" : "false"}
        aria-describedby={descricoes || undefined}
        className={entrada}
        {...props}
      />
      {ajuda && (
        <p id={`${id}-ajuda`} className={textoAjuda}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p
          id={`${id}-erro`}
          role="alert"
          className="text-xs text-red-700 dark:text-red-400"
        >
          {erro}
        </p>
      )}
    </div>
  );
}
