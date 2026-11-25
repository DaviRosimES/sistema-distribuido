import { formatarMoeda, formatarPct, formatarSats } from "../format";

// null: só as taxas percentuais já passam do alvo. 0: sem taxa fixa nem saque mínimo,
// então qualquer valor fica dentro do alvo.
function textoValorMinimo(valor, moeda) {
  if (valor === null) return "Impossível";
  if (valor === 0) return "Qualquer valor";
  return formatarMoeda(valor, moeda);
}

// Tabela com o resultado de uma simulação. O ranking já vem ordenado da API:
// viáveis da mais barata pra mais cara, inviáveis no fim com o motivo.
export function RankingTabela({ simulacao }) {
  const { ranking, compras_por_saque, custo_alvo_pct, moeda } = simulacao;
  const juntaSaques = compras_por_saque > 1;

  return (
    // overflow-x-auto: no celular só a tabela rola de lado, a página não
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Ranking de custo por corretora</caption>
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <tr>
            <th scope="col" className="p-2">
              #
            </th>
            <th scope="col" className="p-2">
              Corretora
            </th>
            <th scope="col" className="p-2 text-right">
              Chega na carteira
            </th>
            <th scope="col" className="p-2 text-right">
              Custo total
            </th>
            <th scope="col" className="p-2">
              Composição
            </th>
            <th scope="col" className="p-2 text-right">
              Mínimo p/ {formatarPct(custo_alvo_pct)}
            </th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item, posicao) => (
            <tr
              key={item.corretora_id}
              className={`border-t border-slate-200 dark:border-slate-700 ${posicao === 0 && item.viavel ? "bg-green-50 dark:bg-green-950/40" : ""} ${item.viavel ? "" : "text-slate-500 dark:text-slate-400"}`}
            >
              <td className="p-2">{item.viavel ? `${posicao + 1}º` : "—"}</td>
              <th scope="row" className="p-2 font-medium">
                {item.corretora_nome}
                {posicao === 0 && item.viavel && (
                  <span className="ml-2 inline-block rounded bg-green-600 px-1.5 py-0.5 text-xs whitespace-nowrap text-white">
                    Mais barata
                  </span>
                )}
              </th>
              {item.viavel ? (
                <>
                  <td className="p-2 text-right">
                    {formatarSats(item.sats_recebidos)}
                  </td>
                  <td className="p-2 text-right">
                    <span className="font-semibold">
                      {formatarMoeda(item.custo_total, moeda)}
                    </span>
                    <span className="block text-xs">
                      {formatarPct(item.custo_pct)}
                    </span>
                  </td>
                  <td className="p-2 text-xs">
                    Negociação {formatarMoeda(item.taxa_negociacao, moeda)} ·
                    Spread {formatarMoeda(item.spread, moeda)} · Saque{" "}
                    {formatarMoeda(item.taxa_saque, moeda)}
                    {juntaSaques && item.economia > 0 && (
                      <span className="block text-green-700 dark:text-green-400">
                        Economia de {formatarMoeda(item.economia, moeda)}{" "}
                        juntando {compras_por_saque} compras por saque
                      </span>
                    )}
                  </td>
                </>
              ) : (
                <td colSpan={3} className="p-2 italic">
                  {item.motivo}
                </td>
              )}
              <td className="p-2 text-right">
                {textoValorMinimo(item.valor_minimo, moeda)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
