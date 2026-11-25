// Simulação no formato que a API devolve, com os números do exemplo do backend:
// R$ 1000 a R$ 500.000/BTC -> 11,5% de custo na "Corretora A"
export function itemRanking(alteracoes = {}) {
  return {
    corretora_id: 1,
    corretora_nome: "Corretora A",
    viavel: true,
    motivo: null,
    taxa_negociacao: 5,
    spread: 10,
    taxa_saque_sats: 20000,
    taxa_saque: 100,
    sats_recebidos: 177000,
    custo_total: 115,
    custo_pct: 11.5,
    economia: 0,
    valor_minimo: null,
    ...alteracoes,
  };
}

export function simulacao(alteracoes = {}) {
  return {
    id: 1,
    descricao: null,
    valor: 1000,
    preco_btc: 500000,
    rede: "onchain",
    compras_por_saque: 1,
    custo_alvo_pct: 1,
    criada_em: "2026-11-25T12:00:00Z",
    ranking: [itemRanking()],
    melhor_corretora: "Corretora A",
    ...alteracoes,
  };
}
