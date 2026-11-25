import { Pencil, Power, Zap } from "lucide-react";
import { useState } from "react";
import { formatarPct, formatarSats } from "../format";
import { botao, numeroMono } from "../ui";
import { BotaoRemover } from "./BotaoRemover";
import { CorretoraForm } from "./CorretoraForm";

function Taxa({ nome, children }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{nome}</dt>
      <dd className={`text-sm ${numeroMono}`}>{children}</dd>
    </div>
  );
}

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
      <li className="p-4 sm:p-5">
        <CorretoraForm
          corretora={corretora}
          embutido
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
    <li aria-label={corretora.nome} className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={`font-semibold break-words ${corretora.ativa ? "" : "text-zinc-400 dark:text-zinc-500"}`}
        >
          {corretora.nome}
        </h3>
        {corretora.suporta_lightning && (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            <Zap aria-hidden="true" className="size-3 text-btc" />
            Lightning
          </span>
        )}
        {!corretora.ativa && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Inativa
          </span>
        )}
      </div>

      <dl
        className={`grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5 ${corretora.ativa ? "" : "opacity-60"}`}
      >
        <Taxa nome="Negociação">
          {formatarPct(corretora.taxa_negociacao_pct)}
        </Taxa>
        <Taxa nome="Spread">{formatarPct(corretora.spread_pct)}</Taxa>
        <Taxa nome="Saque on-chain">
          {formatarSats(corretora.taxa_saque_onchain_sats)}
        </Taxa>
        {corretora.suporta_lightning && (
          <Taxa nome="Saque Lightning">
            {formatarSats(corretora.taxa_saque_lightning_sats)}
          </Taxa>
        )}
        {corretora.saque_minimo_sats > 0 && (
          <Taxa nome="Saque mínimo">
            {formatarSats(corretora.saque_minimo_sats)}
          </Taxa>
        )}
      </dl>
      {corretora.observacoes && (
        <p className="max-w-prose text-xs leading-relaxed text-zinc-500 break-words dark:text-zinc-400">
          {corretora.observacoes}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          disabled={ocupado}
          className={botao}
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => executar(() => onAlternarAtiva(corretora))}
          disabled={ocupado}
          className={botao}
        >
          <Power aria-hidden="true" className="size-3.5" />
          {corretora.ativa ? "Desativar" : "Ativar"}
        </button>
        <BotaoRemover
          onConfirmar={() => executar(() => onRemover(corretora))}
          disabled={ocupado}
        />
      </div>
    </li>
  );
}
