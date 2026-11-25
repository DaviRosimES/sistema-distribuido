import { request } from "./api";

// O navegador chama a nossa API, que busca o preço nas fontes externas (Binance ou CoinGecko)
export function obterCotacao() {
  return request("/cotacao", undefined, "Erro ao buscar a cotação.");
}
