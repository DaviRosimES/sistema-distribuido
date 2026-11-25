import { useState } from "react";
import { formatarPct, formatarSats } from "../format";
import { CorretoraForm } from "./CorretoraForm";

export function CorretoraItem({
  corretora,
  onEditar,
  onAlternarAtiva,
  onRemover,
}) {
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Enquanto a API não responde, os botões ficam travados pra não mandar a ação duas vezes
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
        <CorretoraForm
          corretora={corretora}
          rotuloBotao="Salvar"
          onCancelar={() => setEditando(false)}
          onSalvar={async (valores) => {
            // Se a API recusar, o erro sobe pro formulário e a edição continua aberta
            await onEditar(corretora, valores);
            setEditando(false);
          }}
        />
      </li>
    );
  }

  return (
    <li
      aria-label={corretora.nome}
      className={`space-y-3 rounded-lg border bg-white p-4 shadow-sm ${corretora.ativa ? "border-slate-200" : "border-dashed border-slate-300 opacity-75"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold break-words">{corretora.nome}</h3>
        {!corretora.ativa && (
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">
            Inativa
          </span>
        )}
        {corretora.suporta_lightning && (
          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
            ⚡ Lightning
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Negociação</dt>
          <dd>{formatarPct(corretora.taxa_negociacao_pct)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Spread</dt>
          <dd>{formatarPct(corretora.spread_pct)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Saque on-chain</dt>
          <dd>{formatarSats(corretora.taxa_saque_onchain_sats)}</dd>
        </div>
        {corretora.suporta_lightning && (
          <div>
            <dt className="text-slate-500">Saque Lightning</dt>
            <dd>{formatarSats(corretora.taxa_saque_lightning_sats)}</dd>
          </div>
        )}
        {corretora.saque_minimo_sats > 0 && (
          <div>
            <dt className="text-slate-500">Saque mínimo</dt>
            <dd>{formatarSats(corretora.saque_minimo_sats)}</dd>
          </div>
        )}
      </dl>
      {corretora.observacoes && (
        <p className="text-sm text-slate-600 break-words">
          {corretora.observacoes}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
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
          onClick={() => executar(() => onAlternarAtiva(corretora))}
          disabled={ocupado}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
        >
          {corretora.ativa ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          onClick={() => executar(() => onRemover(corretora))}
          disabled={ocupado}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
