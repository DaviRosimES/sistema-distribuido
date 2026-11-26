import { enviarJson, request } from "./api";

// Sem barra no final, igual às rotas do FastAPI. Com barra a API responde 307 e o
// navegador pode se perder no redirecionamento por causa do CORS.
const CAMINHO = "/corretoras";

export function listarCorretoras() {
  return request(CAMINHO, undefined, "Erro ao carregar as corretoras.");
}

export function criarCorretora(dados) {
  return request(
    CAMINHO,
    enviarJson("POST", dados),
    "Erro ao cadastrar a corretora.",
  );
}

// PUT troca a corretora inteira, então o formulário manda todos os campos
export function substituirCorretora(id, dados) {
  return request(
    `${CAMINHO}/${id}`,
    enviarJson("PUT", dados),
    "Erro ao salvar a corretora.",
  );
}

// PATCH manda só o que mudou (ex.: ativar/desativar)
export function atualizarCorretora(id, alteracoes) {
  return request(
    `${CAMINHO}/${id}`,
    enviarJson("PATCH", alteracoes),
    "Erro ao atualizar a corretora.",
  );
}

export function removerCorretora(id) {
  return request(
    `${CAMINHO}/${id}`,
    { method: "DELETE" },
    "Erro ao remover a corretora.",
  );
}
