import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL, ERRO_CONEXAO } from "../../src/services/api";
import {
  atualizarCorretora,
  criarCorretora,
  listarCorretoras,
  removerCorretora,
  substituirCorretora,
} from "../../src/services/corretoras";
import {
  atualizarSimulacao,
  criarSimulacao,
  listarSimulacoes,
  removerSimulacao,
} from "../../src/services/simulacoes";
import { resposta } from "../helpers/api";

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(resposta(200, { id: 1 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const JSON_HEADERS = { "Content-Type": "application/json" };

describe("serviço de corretoras", () => {
  it("listarCorretoras faz GET em /corretoras", async () => {
    fetchMock.mockResolvedValue(resposta(200, [{ id: 1 }]));

    expect(await listarCorretoras()).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/corretoras`, undefined);
  });

  it.each([
    [
      "criarCorretora",
      () => criarCorretora({ nome: "A" }),
      "/corretoras",
      "POST",
    ],
    [
      "substituirCorretora",
      () => substituirCorretora(1, { nome: "A" }),
      "/corretoras/1",
      "PUT",
    ],
    [
      "atualizarCorretora",
      () => atualizarCorretora(1, { nome: "A" }),
      "/corretoras/1",
      "PATCH",
    ],
  ])(
    "%s manda o JSON com o método certo",
    async (_, chamar, caminho, metodo) => {
      await chamar();

      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}${caminho}`, {
        method: metodo,
        headers: JSON_HEADERS,
        body: JSON.stringify({ nome: "A" }),
      });
    },
  );

  it("removerCorretora faz DELETE e devolve null no 204", async () => {
    fetchMock.mockResolvedValue(resposta(204));

    expect(await removerCorretora(3)).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/corretoras/3`, {
      method: "DELETE",
    });
  });
});

describe("serviço de simulações", () => {
  it("listarSimulacoes faz GET em /simulacoes", async () => {
    fetchMock.mockResolvedValue(resposta(200, []));

    expect(await listarSimulacoes()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/simulacoes`, undefined);
  });

  it("criarSimulacao faz POST com os parâmetros", async () => {
    await criarSimulacao({ valor: 1000 });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/simulacoes`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ valor: 1000 }),
    });
  });

  it("atualizarSimulacao faz PATCH e removerSimulacao faz DELETE", async () => {
    await atualizarSimulacao(2, { descricao: "x" });
    fetchMock.mockResolvedValue(resposta(204));
    await removerSimulacao(2);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_URL}/simulacoes/2`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ descricao: "x" }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_URL}/simulacoes/2`, {
      method: "DELETE",
    });
  });
});

describe("tratamento de erros", () => {
  it("API fora do ar vira erro de conexão", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(listarCorretoras()).rejects.toThrow(ERRO_CONEXAO);
  });

  it("usa o detail em texto da API (409, 404 e regra de negócio)", async () => {
    fetchMock.mockResolvedValue(
      resposta(409, { detail: "Já existe uma corretora com esse nome" }),
    );

    await expect(criarCorretora({})).rejects.toThrow(
      "Já existe uma corretora com esse nome",
    );
  });

  it("no 422 de validação mostra o campo e a mensagem do primeiro erro", async () => {
    fetchMock.mockResolvedValue(
      resposta(422, {
        detail: [{ loc: ["body", "spread_pct"], msg: "Input should be <= 10" }],
      }),
    );

    await expect(criarCorretora({})).rejects.toThrow(
      "Erro ao cadastrar a corretora. (spread_pct: Input should be <= 10)",
    );
  });

  it("sem corpo JSON usa a mensagem padrão", async () => {
    fetchMock.mockResolvedValue(resposta(500));

    await expect(listarSimulacoes()).rejects.toThrow(
      "Erro ao carregar as simulações.",
    );
  });
});
