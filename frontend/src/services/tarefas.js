// A URL da API vem do Vite (VITE_API_URL); sem ela, uso a porta padrão do backend.
// Variáveis VITE_* vão parar no código do navegador, então nunca coloco senha nelas.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Sem barra no final, igual às rotas do FastAPI. Com barra a API responde 307 e o
// navegador pode se perder no redirecionamento por causa do CORS.
const TAREFAS_URL = `${API_URL}/tarefas`;

const JSON_HEADERS = { "Content-Type": "application/json" };

export const ERRO_CONEXAO = "Não foi possível conectar à API.";

// Todas as chamadas passam por aqui, que trata os três cenários:
// 1. fetch rejeita (API fora do ar, rede, CORS): erro de conexão
// 2. resposta 4xx/5xx: usa o "detail" da API ou a mensagem padrão
// 3. sucesso: devolve o JSON (ou null no 204 do DELETE, que não tem corpo)
async function request(url, opcoes, mensagemPadrao) {
  let response;
  try {
    response = await fetch(url, opcoes);
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
    // 404 e 409 trazem o detail em texto. O 422 do FastAPI traz uma lista de erros,
    // que não serve pra mostrar pro usuário, então nesse caso fica a mensagem padrão.
    if (typeof corpo.detail === "string") return corpo.detail;
  } catch {
    // corpo vazio ou que não é JSON
  }
  return mensagemPadrao;
}

export function listarTarefas(concluida) {
  const url =
    concluida === undefined
      ? TAREFAS_URL
      : `${TAREFAS_URL}?concluida=${concluida}`;
  return request(url, undefined, "Erro ao carregar as tarefas.");
}

export function buscarTarefa(id) {
  return request(
    `${TAREFAS_URL}/${id}`,
    undefined,
    "Erro ao carregar a tarefa.",
  );
}

export function criarTarefa({ titulo, descricao }) {
  return request(
    TAREFAS_URL,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ titulo, descricao: descricao || null }),
    },
    "Erro ao cadastrar a tarefa.",
  );
}

// PUT troca a tarefa inteira, então precisa mandar todos os campos (inclusive concluida)
export function substituirTarefa(id, { titulo, descricao, concluida }) {
  return request(
    `${TAREFAS_URL}/${id}`,
    {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ titulo, descricao: descricao || null, concluida }),
    },
    "Erro ao salvar a tarefa.",
  );
}

// PATCH manda só o que mudou
export function atualizarTarefa(id, alteracoes) {
  return request(
    `${TAREFAS_URL}/${id}`,
    {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(alteracoes),
    },
    "Erro ao atualizar a tarefa.",
  );
}

export function removerTarefa(id) {
  return request(
    `${TAREFAS_URL}/${id}`,
    { method: "DELETE" },
    "Erro ao remover a tarefa.",
  );
}
