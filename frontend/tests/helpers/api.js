import { vi } from "vitest";

// Monta uma resposta parecida com a do fetch de verdade. O json() devolve uma cópia,
// igual ao fetch real, que sempre cria objetos novos a partir do texto da resposta.
export function resposta(status, corpo) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (corpo === undefined) throw new SyntaxError("sem corpo");
      return structuredClone(corpo);
    },
  };
}

// API falsa pros testes de integração: responde ao fetch como o backend responderia
// (lista, cria, atualiza, remove, 404 e 409), mas guardando tudo num array em memória.
// Assim os testes exercitam a integração do front com a API sem precisar do servidor.
export function criarApiFalsa(tarefasIniciais = []) {
  const tarefas = tarefasIniciais.map((tarefa) => ({
    descricao: null,
    concluida: false,
    ...tarefa,
  }));
  let proximoId = Math.max(0, ...tarefas.map((tarefa) => tarefa.id)) + 1;

  function tituloEmUso(titulo, id) {
    return tarefas.some(
      (tarefa) => tarefa.titulo === titulo && tarefa.id !== id,
    );
  }

  const fetch = vi.fn(async (url, opcoes = {}) => {
    const { pathname, searchParams } = new URL(url);
    const metodo = opcoes.method ?? "GET";
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : undefined;
    const [, , idDaRota] = pathname.split("/");

    if (!idDaRota) {
      if (metodo === "GET") {
        const filtro = searchParams.get("concluida");
        return resposta(
          200,
          filtro === null
            ? tarefas
            : tarefas.filter((tarefa) => String(tarefa.concluida) === filtro),
        );
      }
      if (tituloEmUso(corpo.titulo)) {
        return resposta(409, {
          detail: "Já existe uma tarefa com esse título",
        });
      }
      const criada = { id: proximoId++, concluida: false, ...corpo };
      tarefas.push(criada);
      return resposta(201, criada);
    }

    const id = Number(idDaRota);
    const indice = tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice === -1) {
      return resposta(404, { detail: `Tarefa ${id} não encontrada` });
    }
    if (metodo === "DELETE") {
      tarefas.splice(indice, 1);
      return resposta(204);
    }
    if (metodo === "PUT" || metodo === "PATCH") {
      if (corpo.titulo !== undefined && tituloEmUso(corpo.titulo, id)) {
        return resposta(409, {
          detail: "Já existe uma tarefa com esse título",
        });
      }
      tarefas[indice] = { ...tarefas[indice], ...corpo };
    }
    return resposta(200, tarefas[indice]);
  });

  return { fetch, tarefas };
}
