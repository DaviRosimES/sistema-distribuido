import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { API_URL, ERRO_CONEXAO } from "../../src/services/tarefas";
import { criarApiFalsa } from "../helpers/api";

// O App é renderizado inteiro (formulário + lista + serviço) e só o fetch é trocado
// pela API falsa. Os testes olham o que aparece na tela e quais requisições saíram.
function renderizarApp(tarefasIniciais = []) {
  const api = criarApiFalsa(tarefasIniciais);
  vi.stubGlobal("fetch", api.fetch);
  const user = userEvent.setup();
  render(<App />);
  return { user, api };
}

async function cadastrar(user, titulo, descricao = "") {
  await user.type(screen.getByLabelText("Título"), titulo);
  if (descricao) {
    await user.type(screen.getByLabelText("Descrição"), descricao);
  }
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App carregando as tarefas", () => {
  it("mostra 'Carregando tarefas...' enquanto a API não responde", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);

    expect(screen.getByText("Carregando tarefas...")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma tarefa cadastrada."),
    ).not.toBeInTheDocument();
  });

  it("mostra as tarefas que vieram da API", async () => {
    renderizarApp([
      { id: 1, titulo: "Estudar", descricao: "Prática 7" },
      { id: 2, titulo: "Revisar" },
    ]);

    const linhas = await screen.findAllByRole("listitem");

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Estudar");
    expect(linhas[0]).toHaveTextContent("Prática 7");
    expect(linhas[1]).toHaveTextContent("Revisar");
    expect(screen.queryByText("Carregando tarefas...")).not.toBeInTheDocument();
  });

  it("mostra a lista vazia quando a API não tem tarefas", async () => {
    const { api } = renderizarApp();

    expect(
      await screen.findByText("Nenhuma tarefa cadastrada."),
    ).toBeInTheDocument();
    expect(api.fetch).toHaveBeenCalledWith(`${API_URL}/tarefas`, undefined);
  });

  it("mostra o erro de conexão quando a API está fora do ar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERRO_CONEXAO);
    expect(
      screen.queryByText("Nenhuma tarefa cadastrada."),
    ).not.toBeInTheDocument();
  });
});

describe("App cadastrando tarefas", () => {
  it("envia o POST e mostra a tarefa criada na lista", async () => {
    const { user, api } = renderizarApp();
    await screen.findByText("Nenhuma tarefa cadastrada.");

    await cadastrar(user, "Estudar", "Prática 7");

    const linha = await screen.findByRole("listitem");
    expect(linha).toHaveTextContent("Estudar");
    expect(linha).toHaveTextContent("Prática 7");
    expect(api.fetch).toHaveBeenCalledWith(
      `${API_URL}/tarefas`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ titulo: "Estudar", descricao: "Prática 7" }),
      }),
    );
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("coloca a tarefa nova no fim da lista", async () => {
    const { user } = renderizarApp([{ id: 1, titulo: "Primeira" }]);
    await screen.findByRole("listitem");

    await cadastrar(user, "Segunda");

    await waitFor(() => {
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
    const titulos = screen
      .getAllByRole("listitem")
      .map((linha) => within(linha).getByText(/Primeira|Segunda/).textContent);
    expect(titulos).toEqual(["Primeira", "Segunda"]);
  });

  it("mostra o erro 409 da API e mantém o que foi digitado", async () => {
    const { user } = renderizarApp([{ id: 1, titulo: "Estudar" }]);
    await screen.findByRole("listitem");

    await cadastrar(user, "Estudar", "de novo");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma tarefa com esse título",
    );
    expect(screen.getByLabelText("Título")).toHaveValue("Estudar");
    expect(screen.getByLabelText("Descrição")).toHaveValue("de novo");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("não chama a API quando a validação do front barra o título", async () => {
    const { user, api } = renderizarApp();
    await screen.findByText("Nenhuma tarefa cadastrada.");

    await cadastrar(user, "   ", "Só descrição");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O título é obrigatório.",
    );
    // Só o GET da listagem, nenhum POST
    expect(api.fetch).toHaveBeenCalledOnce();
  });
});

describe("App alterando tarefas", () => {
  it("marca como concluída mandando um PATCH", async () => {
    const { user, api } = renderizarApp([{ id: 1, titulo: "Estudar" }]);

    await user.click(await screen.findByRole("checkbox", { name: "Estudar" }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Estudar" })).toBeChecked();
    });
    expect(api.fetch).toHaveBeenCalledWith(
      `${API_URL}/tarefas/1`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ concluida: true }),
      }),
    );
  });

  it("edita com PUT mantendo o status de concluída", async () => {
    const { user, api } = renderizarApp([
      { id: 1, titulo: "Estudar", concluida: true },
    ]);

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.clear(screen.getAllByLabelText("Título")[1]);
    await user.type(screen.getAllByLabelText("Título")[1], "Revisar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByRole("checkbox", { name: "Revisar" }),
    ).toBeChecked();
    expect(api.fetch).toHaveBeenCalledWith(
      `${API_URL}/tarefas/1`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          titulo: "Revisar",
          descricao: null,
          concluida: true,
        }),
      }),
    );
  });

  it("mostra o 409 na edição quando o título já é de outra tarefa", async () => {
    const { user } = renderizarApp([
      { id: 1, titulo: "Estudar" },
      { id: 2, titulo: "Revisar" },
    ]);

    const [, segunda] = await screen.findAllByRole("listitem");
    await user.click(within(segunda).getByRole("button", { name: "Editar" }));
    const campo = within(segunda).getByLabelText("Título");
    await user.clear(campo);
    await user.type(campo, "Estudar");
    await user.click(within(segunda).getByRole("button", { name: "Salvar" }));

    expect(await within(segunda).findByRole("alert")).toHaveTextContent(
      "Já existe uma tarefa com esse título",
    );
    expect(campo).toHaveValue("Estudar");
  });

  it("remove com DELETE e volta pra lista vazia", async () => {
    const { user, api } = renderizarApp([{ id: 1, titulo: "Estudar" }]);

    await user.click(await screen.findByRole("button", { name: "Remover" }));

    expect(
      await screen.findByText("Nenhuma tarefa cadastrada."),
    ).toBeInTheDocument();
    expect(api.fetch).toHaveBeenCalledWith(`${API_URL}/tarefas/1`, {
      method: "DELETE",
    });
  });

  it("mostra o 404 quando a tarefa já tinha sido removida em outra aba", async () => {
    const { user, api } = renderizarApp([{ id: 1, titulo: "Estudar" }]);
    await screen.findByRole("listitem");
    // Some do "banco" sem passar pela tela
    api.tarefas.splice(0, 1);

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tarefa 1 não encontrada",
    );
  });
});
