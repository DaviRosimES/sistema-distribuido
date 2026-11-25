import {
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useId, useState } from "react";
import {
  formatarData,
  formatarMoeda,
  formatarPct,
  formatarSats,
} from "../format";
import {
  botao,
  botaoPerigo,
  botaoPrimario,
  entrada,
  numero,
  numeroMono,
  painel,
  rotulo,
} from "../ui";
import { DESCRICAO_SIMULACAO_MAX_LENGTH } from "../validation";
import { Aviso } from "./Aviso";
import { RankingTabela } from "./RankingTabela";

const NOME_DA_REDE = { onchain: "on-chain", lightning: "Lightning" };

// A resposta da simulação em destaque: onde comprar e quanto chega na carteira
function Destaque({ simulacao, melhor }) {
  const { moeda, compras_por_saque } = simulacao;
  const valorCiclo = simulacao.valor * compras_por_saque;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Melhor opção
      </p>
      <p className="text-xl font-semibold tracking-tight sm:text-2xl">
        <span>{melhor.corretora_nome}</span>
        <span className="text-zinc-300 dark:text-zinc-600"> · </span>
        <span className={`${numeroMono} text-btc-texto dark:text-btc`}>
          {formatarSats(melhor.sats_recebidos)}
        </span>{" "}
        <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
          na carteira
        </span>
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Custo de{" "}
        <span className={numero}>
          {formatarMoeda(melhor.custo_total, moeda)} (
          {formatarPct(melhor.custo_pct)})
        </span>{" "}
        sobre <span className={numero}>{formatarMoeda(valorCiclo, moeda)}</span>
        {compras_por_saque > 1 && ` em ${compras_por_saque} compras`}
        {melhor.economia > 0 && (
          <>
            {" "}
            —{" "}
            <span className={numero}>
              {formatarMoeda(melhor.economia, moeda)}
            </span>{" "}
            a menos que sacar a cada compra
          </>
        )}
        .
      </p>
    </div>
  );
}

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
    <li aria-label={titulo} className={`${painel} space-y-4 p-4 sm:p-5`}>
      {editando ? (
        <form
          onSubmit={salvarDescricao}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label htmlFor={`${id}-descricao`} className={rotulo}>
              Descrição
            </label>
            <input
              id={`${id}-descricao`}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className={entrada}
            />
          </div>
          <button type="submit" disabled={ocupado} className={botaoPrimario}>
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setDescricao(simulacao.descricao ?? "");
            }}
            className={`${botao} justify-center py-2`}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-semibold break-words">{titulo}</h3>
          <p className={`text-xs text-zinc-500 dark:text-zinc-400 ${numero}`}>
            {formatarData(simulacao.criada_em)}
          </p>
        </div>
      )}

      <p className="-mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {formatarMoeda(simulacao.valor, simulacao.moeda)} por compra · BTC a{" "}
        {formatarMoeda(simulacao.preco_btc, simulacao.moeda)} · saque{" "}
        {NOME_DA_REDE[simulacao.rede]}
        {simulacao.compras_por_saque > 1 &&
          ` a cada ${simulacao.compras_por_saque} compras`}
      </p>

      {melhor ? (
        <Destaque simulacao={simulacao} melhor={melhor} />
      ) : (
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Nenhuma corretora viável para esses parâmetros
        </p>
      )}

      <Aviso>{erro}</Aviso>

      {mostrarRanking && <RankingTabela simulacao={simulacao} />}

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMostrarRanking((atual) => !atual)}
          aria-expanded={mostrarRanking}
          className={botao}
        >
          {mostrarRanking ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
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
            className={botao}
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            Editar descrição
          </button>
        )}
        <button
          type="button"
          onClick={recalcular}
          disabled={ocupado}
          className={botao}
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Recalcular com taxas atuais
        </button>
        <button
          type="button"
          onClick={() => executar(() => onRemover(simulacao))}
          disabled={ocupado}
          className={`${botaoPerigo} sm:ml-auto`}
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Remover
        </button>
      </div>
    </li>
  );
}
