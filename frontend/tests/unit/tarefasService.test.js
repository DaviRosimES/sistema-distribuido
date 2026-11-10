import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_URL,
  atualizarTarefa,
  buscarTarefa,
  criarTarefa,
  ERRO_CONEXAO,
  listarTarefas,
  removerTarefa,
  substituirTarefa,
} from "../../src/services/tarefas";
import { resposta } from "../helpers/api";

const TAREFA = { id: 1, titulo: "Estudar", descricao: null, concluida: false };

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(resposta(200, TAREFA));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chamadas da API", () => {
  it("listarTarefas faz GET em /tarefas e devolve a lista", async () => {
    fetchMock.mockResolvedValue(resposta(200, [TAREFA]));

    const tarefas = await listarTarefas();

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas`, undefined);
    expect(tarefas).toEqual([TAREFA]);
  });

  it.each([true, false])(
    "listarTarefas(%s) manda o filtro na query",
    async (concluida) => {
      fetchMock.mockResolvedValue(resposta(200, []));

      await listarTarefas(concluida);

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_URL}/tarefas?concluida=${concluida}`,
        undefined,
      );
    },
  );

  it("buscarTarefa faz GET em /tarefas/{id}", async () => {
    const tarefa = await buscarTarefa(1);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas/1`, undefined);
    expect(tarefa).toEqual(TAREFA);
  });

  it("criarTarefa faz POST com o JSON e descrição vazia vira null", async () => {
    fetchMock.mockResolvedValue(resposta(201, TAREFA));

    await criarTarefa({ titulo: "Estudar", descricao: "" });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: "Estudar", descricao: null }),
    });
  });

  it("substituirTarefa faz PUT mandando todos os campos", async () => {
    await substituirTarefa(1, {
      titulo: "Estudar",
      descricao: "Prática 7",
      concluida: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: "Estudar",
        descricao: "Prática 7",
        concluida: true,
      }),
    });
  });

  it("atualizarTarefa faz PATCH só com o que mudou", async () => {
    await atualizarTarefa(1, { concluida: true });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concluida: true }),
    });
  });

  it("removerTarefa faz DELETE e devolve null no 204", async () => {
    fetchMock.mockResolvedValue(resposta(204));

    const resultado = await removerTarefa(1);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tarefas/1`, {
      method: "DELETE",
    });
    expect(resultado).toBeNull();
  });
});

describe("tratamento de erros", () => {
  it("avisa que não conectou quando o fetch rejeita", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(listarTarefas()).rejects.toThrow(ERRO_CONEXAO);
  });

  it.each([
    [409, "Já existe uma tarefa com esse título"],
    [404, "Tarefa 99 não encontrada"],
  ])("usa o detail da API na resposta %i", async (status, detail) => {
    fetchMock.mockResolvedValue(resposta(status, { detail }));

    await expect(
      criarTarefa({ titulo: "Estudar", descricao: "" }),
    ).rejects.toThrow(detail);
  });

  it("usa a mensagem padrão quando o detail é a lista de erros do 422", async () => {
    fetchMock.mockResolvedValue(
      resposta(422, { detail: [{ loc: ["body", "titulo"], msg: "erro" }] }),
    );

    await expect(criarTarefa({ titulo: "", descricao: "" })).rejects.toThrow(
      "Erro ao cadastrar a tarefa.",
    );
  });

  it("usa a mensagem padrão quando a resposta de erro não tem JSON", async () => {
    fetchMock.mockResolvedValue(resposta(500));

    await expect(listarTarefas()).rejects.toThrow(
      "Erro ao carregar as tarefas.",
    );
  });
});
