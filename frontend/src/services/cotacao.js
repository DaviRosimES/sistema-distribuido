import { request } from "./api";

// O navegador chama a nossa API, que busca o preço nas fontes externas (Binance ou CoinGecko)
export function obterCotacao(moeda = "BRL") {
  return request(
    `/cotacao?moeda=${moeda}`,
    undefined,
    "Erro ao buscar a cotação.",
  );
}
