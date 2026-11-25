import { vi } from "vitest";
import { itemRanking } from "./simulacao";

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

export function corretora(alteracoes = {}) {
  return {
    id: 1,
    nome: "Corretora A",
    taxa_negociacao_pct: 0.5,
    spread_pct: 1,
    taxa_saque_onchain_sats: 20000,
    saque_minimo_sats: 0,
    suporta_lightning: false,
    taxa_saque_lightning_sats: null,
    ativa: true,
    observacoes: null,
    ...alteracoes,
  };
}

// API falsa pros testes de integração: responde ao fetch como o backend responderia
// (lista, cria, atualiza, remove, 404, 409 e 422), mas guardando tudo em memória.
// O cálculo do ranking de verdade é testado no backend; aqui cada corretora ativa vira um
// item com custo fixo, o suficiente pra testar a tela.
export function criarApiFalsa({ corretoras = [], simulacoes = [] } = {}) {
  const dados = {
    corretoras: corretoras.map((c) => corretora(c)),
    simulacoes: [...simulacoes],
  };
  const proximoId = { corretoras: 100, simulacoes: 100 };

  function ranking() {
    return dados.corretoras
      .filter((c) => c.ativa)
      .map((c) => itemRanking({ corretora_id: c.id, corretora_nome: c.nome }));
  }

  const fetch = vi.fn(async (url, opcoes = {}) => {
    const { pathname } = new URL(url);
    const metodo = opcoes.method ?? "GET";
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : undefined;
    const [, recurso, idDaRota] = pathname.split("/");
    const lista = dados[recurso];
    const nomeRecurso = recurso === "corretoras" ? "Corretora" : "Simulação";

    if (!idDaRota) {
      if (metodo === "GET") return resposta(200, lista);
      if (recurso === "corretoras") {
        if (
          lista.some((c) => c.nome.toLowerCase() === corpo.nome.toLowerCase())
        ) {
          return resposta(409, {
            detail: "Já existe uma corretora com esse nome",
          });
        }
        const criada = corretora({ ...corpo, id: proximoId.corretoras++ });
        lista.push(criada);
        return resposta(201, criada);
      }
      if (ranking().length === 0) {
        return resposta(422, {
          detail: "Cadastre pelo menos uma corretora ativa antes de simular",
        });
      }
      const criada = {
        ...corpo,
        id: proximoId.simulacoes++,
        criada_em: "2026-11-25T12:00:00Z",
        ranking: ranking(),
      };
      lista.unshift(criada);
      return resposta(201, criada);
    }

    const id = Number(idDaRota);
    const indice = lista.findIndex((item) => item.id === id);
    if (indice === -1) {
      return resposta(404, { detail: `${nomeRecurso} ${id} não encontrada` });
    }
    if (metodo === "DELETE") {
      lista.splice(indice, 1);
      return resposta(204);
    }
    if (metodo === "PUT" || metodo === "PATCH") {
      lista[indice] = { ...lista[indice], ...corpo };
      if (recurso === "simulacoes" && corpo.valor_brl !== undefined) {
        lista[indice].ranking = ranking();
      }
    }
    return resposta(200, lista[indice]);
  });

  return { fetch, dados };
}
