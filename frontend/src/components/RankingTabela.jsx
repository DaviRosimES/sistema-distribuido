import { formatarMoeda, formatarPct, formatarSats } from "../format";
import { numero, numeroMono } from "../ui";

// null: só as taxas percentuais já passam do alvo. 0: sem taxa fixa nem saque mínimo,
// então qualquer valor fica dentro do alvo.
function textoValorMinimo(valor, moeda) {
  if (valor === null) return "Impossível";
  if (valor === 0) return "Qualquer valor";
  return formatarMoeda(valor, moeda);
}

// As três partes do custo, na ordem da barra. A taxa de saque fica em laranja porque é
// ela (fixa) que pesa nas compras pequenas, a ideia central do comparador.
const PARTES = [
  {
    campo: "taxa_negociacao",
    nome: "Negociação",
    cor: "bg-zinc-400 dark:bg-zinc-500",
  },
  { campo: "spread", nome: "Spread", cor: "bg-zinc-300 dark:bg-zinc-600" },
  { campo: "taxa_saque", nome: "Saque", cor: "bg-btc" },
];

// Barra do custo de uma corretora. O comprimento é relativo à corretora mais cara do
// ranking, então dá pra comparar as barras entre si de olho.
function BarraCusto({ item, maiorCusto, moeda }) {
  const descricao = PARTES.map(
    ({ campo, nome }) => `${nome} ${formatarMoeda(item[campo], moeda)}`,
  ).join(", ");
  const largura = maiorCusto > 0 ? (item.custo_total / maiorCusto) * 100 : 0;
  return (
    <div className="space-y-1">
      <div
        role="img"
        aria-label={descricao}
        title={descricao}
        className="flex h-2 overflow-hidden rounded-full"
        style={{ width: `${Math.max(largura, 2)}%` }}
      >
        {PARTES.map(({ campo, cor }) => (
          <div key={campo} className={cor} style={{ flexGrow: item[campo] }} />
        ))}
      </div>
      <p className={`text-xs text-zinc-500 dark:text-zinc-400 ${numero}`}>
        {PARTES.map(({ campo, nome }) => (
          <span key={campo} className="mr-2 whitespace-nowrap">
            {nome.toLowerCase()} {formatarMoeda(item[campo], moeda)}
          </span>
        ))}
      </p>
    </div>
  );
}

// Tabela com o resultado de uma simulação. O ranking já vem ordenado da API:
// viáveis da mais barata pra mais cara, inviáveis no fim com o motivo.
export function RankingTabela({ simulacao }) {
  const { ranking, compras_por_saque, custo_alvo_pct, moeda } = simulacao;
  const juntaSaques = compras_por_saque > 1;
  const maiorCusto = Math.max(
    0,
    ...ranking.filter((item) => item.viavel).map((item) => item.custo_total),
  );

  return (
    <div className="space-y-2">
      {/* overflow-x-auto: no celular só a tabela rola de lado, a página não */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <caption className="sr-only">Ranking de custo por corretora</caption>
          <thead className="text-xs text-zinc-500 dark:text-zinc-400">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th scope="col" className="py-2 pr-2 font-medium">
                #
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Corretora
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Chega na carteira
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Custo total
              </th>
              <th scope="col" className="w-[34%] py-2 pr-4 font-medium">
                Composição do custo
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Mínimo p/ {formatarPct(custo_alvo_pct)}
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, posicao) => {
              const primeira = posicao === 0 && item.viavel;
              return (
                <tr
                  key={item.corretora_id}
                  className={`border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800/70 ${item.viavel ? "" : "text-zinc-400 dark:text-zinc-500"}`}
                >
                  <td
                    className={`py-3 pr-2 ${numeroMono} ${primeira ? "font-medium text-btc-texto dark:text-btc" : "text-zinc-400 dark:text-zinc-500"}`}
                  >
                    {item.viavel ? `${posicao + 1}º` : "—"}
                  </td>
                  <th scope="row" className="py-3 pr-4 font-medium">
                    {item.corretora_nome}
                    {primeira && (
                      <span className="block text-xs font-normal text-btc-texto dark:text-btc">
                        Mais barata
                      </span>
                    )}
                  </th>
                  {item.viavel ? (
                    <>
                      <td className={`py-3 pr-4 text-right ${numeroMono}`}>
                        {formatarSats(item.sats_recebidos)}
                      </td>
                      <td className={`py-3 pr-4 text-right ${numeroMono}`}>
                        <span className="font-medium">
                          {formatarMoeda(item.custo_total, moeda)}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {formatarPct(item.custo_pct)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <BarraCusto
                          item={item}
                          maiorCusto={maiorCusto}
                          moeda={moeda}
                        />
                        {juntaSaques && item.economia > 0 && (
                          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                            Economia de {formatarMoeda(item.economia, moeda)}{" "}
                            juntando {compras_por_saque} compras por saque
                          </p>
                        )}
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="py-3 pr-4 text-sm">
                      {item.motivo}
                    </td>
                  )}
                  <td className={`py-3 text-right ${numeroMono}`}>
                    {textoValorMinimo(item.valor_minimo, moeda)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {PARTES.map(({ campo, nome, cor }) => (
          <span key={campo} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${cor}`} />
            {campo === "taxa_saque" ? "Saque (taxa fixa)" : nome}
          </span>
        ))}
      </p>
    </div>
  );
}
