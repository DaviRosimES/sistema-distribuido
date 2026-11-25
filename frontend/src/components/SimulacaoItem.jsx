import { useId, useState } from "react";
import { formatarData, formatarPct, formatarReais } from "../format";
import { DESCRICAO_SIMULACAO_MAX_LENGTH } from "../validation";
import { Aviso } from "./Aviso";
import { RankingTabela } from "./RankingTabela";

const NOME_DA_REDE = { onchain: "on-chain", lightning: "Lightning" };

export function SimulacaoItem({
  simulacao,
  aberta = false,
  onAtualizar,
  onRemover,
}) {
  const id = useId();
  const [mostrarRanking, setMostrarRanking] = useState(aberta);
  const [editando, setEditando] = useState(false);
  const [descricao, setDescricao] = useState(simulacao.descricao ?? "");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const melhor = simulacao.ranking.find((item) => item.viavel);
  const titulo = simulacao.descricao || `Simulação #${simulacao.id}`;

  async function executar(acao) {
    setErro("");
    setOcupado(true);
    try {
      await acao();
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function salvarDescricao(event) {
    event.preventDefault();
    const limpa = descricao.trim();
    if (limpa.length > DESCRICAO_SIMULACAO_MAX_LENGTH) {
      setErro(
        `A descrição deve ter no máximo ${DESCRICAO_SIMULACAO_MAX_LENGTH} caracteres.`,
      );
      return;
    }
    // Só a descrição: a API mantém o ranking salvo
    if (
      await executar(() => onAtualizar(simulacao, { descricao: limpa || null }))
    ) {
      setEditando(false);
    }
  }

  // Mandar um parâmetro do cálculo (mesmo igual) faz a API refazer o ranking com as taxas atuais
  function recalcular() {
    return executar(() => onAtualizar(simulacao, { valor: simulacao.valor }));
  }

  return (
    <li
      aria-label={titulo}
      className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
    >
      {editando ? (
        <form
          onSubmit={salvarDescricao}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1">
            <label
              htmlFor={`${id}-descricao`}
              className="block text-sm font-medium"
            >
              Descrição
            </label>
            <input
              id={`${id}-descricao`}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-600 p-2"
            />
          </div>
          <button
            type="submit"
            disabled={ocupado}
            className="rounded bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setDescricao(simulacao.descricao ?? "");
            }}
            className="rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div>
          <h3 className="font-semibold break-words">{titulo}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatarData(simulacao.criada_em)}
          </p>
        </div>
      )}

      <p className="text-sm">
        {formatarReais(simulacao.valor)} por compra · BTC a{" "}
        {formatarReais(simulacao.preco_btc)} · saque{" "}
        {NOME_DA_REDE[simulacao.rede]}
        {simulacao.compras_por_saque > 1 &&
          ` a cada ${simulacao.compras_por_saque} compras`}
      </p>
      <p className="text-sm">
        {melhor ? (
          <>
            Melhor opção: <strong>{melhor.corretora_nome}</strong> com custo de{" "}
            {formatarReais(melhor.custo_total)} ({formatarPct(melhor.custo_pct)}
            )
          </>
        ) : (
          <strong className="text-red-700 dark:text-red-300">
            Nenhuma corretora viável para esses parâmetros
          </strong>
        )}
      </p>

      <Aviso>{erro}</Aviso>

      {mostrarRanking && <RankingTabela simulacao={simulacao} />}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMostrarRanking((atual) => !atual)}
          aria-expanded={mostrarRanking}
          className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mostrarRanking ? "Ocultar ranking" : "Ver ranking"}
        </button>
        {!editando && (
          <button
            type="button"
            onClick={() => {
              setDescricao(simulacao.descricao ?? "");
              setEditando(true);
            }}
            disabled={ocupado}
            className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            Editar descrição
          </button>
        )}
        <button
          type="button"
          onClick={recalcular}
          disabled={ocupado}
          className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          Recalcular com taxas atuais
        </button>
        <button
          type="button"
          onClick={() => executar(() => onRemover(simulacao))}
          disabled={ocupado}
          className="rounded border border-red-300 dark:border-red-800 px-3 py-1 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
