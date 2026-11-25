import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { API_URL, ERRO_CONEXAO } from "../../src/services/api";
import { criarApiFalsa } from "../helpers/api";
import { simulacao } from "../helpers/simulacao";

// O App é renderizado inteiro (formulários + listas + serviços) e só o fetch é trocado
// pela API falsa. Os testes olham o que aparece na tela e quais requisições saíram.
function renderizarApp(dadosIniciais) {
  const api = criarApiFalsa(dadosIniciais);
  vi.stubGlobal("fetch", api.fetch);
  const user = userEvent.setup();
  render(<App />);
  return { user, api };
}

async function abrirCorretoras(user) {
  await user.click(await screen.findByRole("tab", { name: "Corretoras" }));
}

function chamadas(api, metodo) {
  return api.fetch.mock.calls.filter(
    ([, opcoes]) => (opcoes?.method ?? "GET") === metodo,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App carregando os dados", () => {
  it("mostra 'Carregando dados...' enquanto a API não responde", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);

    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("busca corretoras e simulações e mostra o histórico", async () => {
    const { api } = renderizarApp({
      corretoras: [{ id: 1 }],
      simulacoes: [simulacao({ descricao: "Compra de novembro" })],
    });

    expect(await screen.findByText("Compra de novembro")).toBeInTheDocument();
    expect(
      screen.getByText("A comparação considera as 1 corretoras ativas."),
    ).toBeInTheDocument();
    expect(api.fetch).toHaveBeenCalledWith(`${API_URL}/corretoras`, undefined);
    expect(api.fetch).toHaveBeenCalledWith(`${API_URL}/simulacoes`, undefined);
  });

  it("mostra o erro de conexão quando a API está fora do ar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(ERRO_CONEXAO);
  });
});

describe("App gerenciando corretoras", () => {
  it("cadastra uma corretora e mostra a confirmação", async () => {
    const { user, api } = renderizarApp();
    await abrirCorretoras(user);
    expect(
      await screen.findByText(/Nenhuma corretora cadastrada/),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome"), "Corretora Nova");
    await user.type(screen.getByLabelText("Taxa de negociação (%)"), "0,2");
    await user.type(screen.getByLabelText("Spread (%)"), "0,5");
    await user.type(
      screen.getByLabelText("Taxa de saque on-chain (sats)"),
      "1000",
    );
    await user.click(
      screen.getByRole("button", { name: "Cadastrar corretora" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Corretora "Corretora Nova" cadastrada.',
    );
    expect(
      screen.getByRole("listitem", { name: "Corretora Nova" }),
    ).toBeInTheDocument();
    const [[url, opcoes]] = chamadas(api, "POST");
    expect(url).toBe(`${API_URL}/corretoras`);
    expect(JSON.parse(opcoes.body)).toMatchObject({
      nome: "Corretora Nova",
      spread_pct: 0.5,
    });
  });

  it("mostra o 409 da API no formulário", async () => {
    const { user } = renderizarApp({
      corretoras: [{ id: 1, nome: "Corretora A" }],
    });
    await abrirCorretoras(user);

    await user.type(await screen.findByLabelText("Nome"), "corretora a");
    await user.type(screen.getByLabelText("Taxa de negociação (%)"), "0");
    await user.type(screen.getByLabelText("Spread (%)"), "0");
    await user.type(
      screen.getByLabelText("Taxa de saque on-chain (sats)"),
      "0",
    );
    await user.click(
      screen.getByRole("button", { name: "Cadastrar corretora" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma corretora com esse nome",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("corretora a");
  });

  it("edita com PUT e desativa com PATCH", async () => {
    const { user, api } = renderizarApp({
      corretoras: [{ id: 1, nome: "Corretora A" }],
    });
    await abrirCorretoras(user);
    const item = await screen.findByRole("listitem", { name: "Corretora A" });

    await user.click(within(item).getByRole("button", { name: "Editar" }));
    const edicao = screen.getByRole("form", { name: "Editar Corretora A" });
    await user.clear(within(edicao).getByLabelText("Nome"));
    await user.type(within(edicao).getByLabelText("Nome"), "Corretora B");
    await user.click(within(edicao).getByRole("button", { name: "Salvar" }));
    const editada = await screen.findByRole("listitem", {
      name: "Corretora B",
    });
    await user.click(
      within(editada).getByRole("button", { name: "Desativar" }),
    );

    expect(await within(editada).findByText("Inativa")).toBeInTheDocument();
    expect(chamadas(api, "PUT")[0][0]).toBe(`${API_URL}/corretoras/1`);
    expect(chamadas(api, "PATCH")[0][1].body).toBe(
      JSON.stringify({ ativa: false }),
    );
  });

  it("remove com DELETE e mostra o 404 se ela já tinha sido removida", async () => {
    const { user, api } = renderizarApp({
      corretoras: [
        { id: 1, nome: "Corretora A" },
        { id: 2, nome: "Corretora B" },
      ],
    });
    await abrirCorretoras(user);
    const primeira = await screen.findByRole("listitem", {
      name: "Corretora A",
    });

    await user.click(within(primeira).getByRole("button", { name: "Remover" }));
    await user.click(
      within(primeira).getByRole("button", { name: "Confirmar remoção" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("removida");
    expect(screen.queryByRole("listitem", { name: "Corretora A" })).toBeNull();

    // Some do "banco" sem passar pela tela (outra aba, por exemplo)
    api.dados.corretoras.splice(0, 1);
    const segunda = screen.getByRole("listitem", { name: "Corretora B" });
    await user.click(within(segunda).getByRole("button", { name: "Remover" }));
    await user.click(
      within(segunda).getByRole("button", { name: "Confirmar remoção" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Corretora 2 não encontrada",
    );
  });
});

describe("App simulando", () => {
  async function simular(user) {
    await user.type(
      await screen.findByLabelText("Valor por compra (R$)"),
      "1000",
    );
    await user.type(screen.getByLabelText("Preço do BTC (R$)"), "500000");
    await user.type(screen.getByLabelText("Descrição (opcional)"), "Teste");
    await user.click(
      screen.getByRole("button", { name: "Comparar corretoras" }),
    );
  }

  it("cria a simulação e já mostra o ranking no topo do histórico", async () => {
    const { user } = renderizarApp({
      corretoras: [{ id: 1 }],
      simulacoes: [simulacao({ id: 7, descricao: "Antiga" })],
    });

    await simular(user);

    const [nova, antiga] = await screen.findAllByRole("listitem");
    expect(nova).toHaveAccessibleName("Teste");
    expect(within(nova).getByRole("table")).toBeInTheDocument();
    expect(within(nova).getByText("Mais barata")).toBeInTheDocument();
    expect(antiga).toHaveAccessibleName("Antiga");
  });

  it("mostra o 422 quando não há corretora ativa", async () => {
    const { user } = renderizarApp();
    expect(
      await screen.findByText(/Nenhuma corretora ativa: cadastre ou ative uma/),
    ).toBeInTheDocument();

    await simular(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cadastre pelo menos uma corretora ativa antes de simular",
    );
  });

  it("edita a descrição e remove uma simulação do histórico", async () => {
    const { user, api } = renderizarApp({
      simulacoes: [simulacao({ id: 7, descricao: "Antiga" })],
    });
    const item = await screen.findByRole("listitem", { name: "Antiga" });

    await user.click(
      within(item).getByRole("button", { name: "Editar descrição" }),
    );
    await user.clear(within(item).getByLabelText("Descrição"));
    await user.type(within(item).getByLabelText("Descrição"), "Renomeada");
    await user.click(within(item).getByRole("button", { name: "Salvar" }));
    const renomeada = await screen.findByRole("listitem", {
      name: "Renomeada",
    });
    await user.click(
      within(renomeada).getByRole("button", { name: "Remover" }),
    );
    await user.click(
      within(renomeada).getByRole("button", { name: "Confirmar remoção" }),
    );

    expect(
      await screen.findByText("Nenhuma simulação salva."),
    ).toBeInTheDocument();
    expect(chamadas(api, "PATCH")[0][1].body).toBe(
      JSON.stringify({ descricao: "Renomeada" }),
    );
    expect(chamadas(api, "DELETE")[0][0]).toBe(`${API_URL}/simulacoes/7`);
  });
});
