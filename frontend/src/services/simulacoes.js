import { enviarJson, request } from "./api";

const CAMINHO = "/simulacoes";

export function listarSimulacoes() {
  return request(CAMINHO, undefined, "Erro ao carregar as simulações.");
}

// A API calcula o ranking com as taxas atuais das corretoras e já salva a simulação
export function criarSimulacao(dados) {
  return request(CAMINHO, enviarJson("POST", dados), "Erro ao simular.");
}

// Mudar só a descrição mantém o ranking; mudar parâmetro faz a API recalcular
export function atualizarSimulacao(id, alteracoes) {
  return request(
    `${CAMINHO}/${id}`,
    enviarJson("PATCH", alteracoes),
    "Erro ao atualizar a simulação.",
  );
}

export function removerSimulacao(id) {
  return request(
    `${CAMINHO}/${id}`,
    { method: "DELETE" },
    "Erro ao remover a simulação.",
  );
}
