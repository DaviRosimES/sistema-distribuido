// A URL da API vem do Vite (VITE_API_URL); sem ela, uso a porta padrão do backend.
// Variáveis VITE_* vão parar no código do navegador, então nunca coloco senha nelas.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const JSON_HEADERS = { "Content-Type": "application/json" };

export const ERRO_CONEXAO = "Não foi possível conectar à API.";

// Todas as chamadas passam por aqui, que trata os três cenários:
// 1. fetch rejeita (API fora do ar, rede, CORS): erro de conexão
// 2. resposta 4xx/5xx: usa o "detail" da API ou a mensagem padrão
// 3. sucesso: devolve o JSON (ou null no 204 do DELETE, que não tem corpo)
export async function request(caminho, opcoes, mensagemPadrao) {
  let response;
  try {
    response = await fetch(`${API_URL}${caminho}`, opcoes);
  } catch {
    throw new Error(ERRO_CONEXAO);
  }

  if (!response.ok) {
    throw new Error(await lerDetalhe(response, mensagemPadrao));
  }

  if (response.status === 204) return null;
  return response.json();
}

async function lerDetalhe(response, mensagemPadrao) {
  try {
    const corpo = await response.json();
    // 404, 409 e as regras de negócio (422) trazem o detail em texto.
    // O 422 de validação do FastAPI traz uma lista; aí mostro o campo e a mensagem do primeiro.
    if (typeof corpo.detail === "string") return corpo.detail;
    if (Array.isArray(corpo.detail) && corpo.detail.length > 0) {
      const [{ loc = [], msg }] = corpo.detail;
      return `${mensagemPadrao} (${loc.at(-1)}: ${msg})`;
    }
  } catch {
    // corpo vazio ou que não é JSON
  }
  return mensagemPadrao;
}

export function enviarJson(metodo, dados) {
  return { method: metodo, headers: JSON_HEADERS, body: JSON.stringify(dados) };
}
