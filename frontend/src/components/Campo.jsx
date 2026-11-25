// Rótulo + input + mensagem de ajuda/erro, ligados por id pra leitores de tela
export function Campo({ id, rotulo, erro, ajuda, className = "", ...props }) {
  const descricoes = [erro && `${id}-erro`, ajuda && `${id}-ajuda`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? "true" : "false"}
        aria-describedby={descricoes || undefined}
        className="w-full rounded border border-slate-300 p-2 aria-[invalid=true]:border-red-600"
        {...props}
      />
      {ajuda && (
        <p id={`${id}-ajuda`} className="text-xs text-slate-500">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
