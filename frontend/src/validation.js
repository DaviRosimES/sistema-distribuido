// Mesmas regras do schema do backend (backend/app/schemas/tarefa.py),
// assim na Prática 7 o front já barra o que a API recusaria com 422
export const TITULO_MAX_LENGTH = 100;
export const DESCRICAO_MAX_LENGTH = 500;

export function validarTarefa({ titulo, descricao }) {
  const erros = {};
  const tituloLimpo = titulo.trim();
  const descricaoLimpa = descricao.trim();

  if (!tituloLimpo) {
    erros.titulo = "O título é obrigatório.";
  } else if (tituloLimpo.length > TITULO_MAX_LENGTH) {
    erros.titulo = `O título deve ter no máximo ${TITULO_MAX_LENGTH} caracteres.`;
  }

  if (descricaoLimpa.length > DESCRICAO_MAX_LENGTH) {
    erros.descricao = `A descrição deve ter no máximo ${DESCRICAO_MAX_LENGTH} caracteres.`;
  }

  return {
    erros,
    valores: { titulo: tituloLimpo, descricao: descricaoLimpa },
  };
}
