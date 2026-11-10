import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

// Aqui o App é renderizado inteiro (formulário + lista) e o teste só olha o que aparece na tela,
// sem depender do estado interno. Assim ele continua valendo quando o App passar a usar a API.
async function adicionarTarefa(user, titulo, descricao = "") {
  await user.type(screen.getByLabelText("Título"), titulo);
  if (descricao) {
    await user.type(screen.getByLabelText("Descrição"), descricao);
  }
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

describe("App", () => {
  it("começa sem tarefas", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Gerenciador de Tarefas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeInTheDocument();
  });

  it("cadastra uma tarefa e mostra ela na lista", async () => {
    const user = userEvent.setup();
    render(<App />);

    await adicionarTarefa(user, "Estudar", "Prática 6");

    const linha = screen.getByRole("listitem");
    expect(linha).toHaveTextContent("Estudar");
    expect(linha).toHaveTextContent("Prática 6");
    expect(
      screen.queryByText("Nenhuma tarefa cadastrada."),
    ).not.toBeInTheDocument();
  });

  it("mantém as tarefas na ordem em que foram cadastradas", async () => {
    const user = userEvent.setup();
    render(<App />);

    await adicionarTarefa(user, "Primeira");
    await adicionarTarefa(user, "Segunda");
    await adicionarTarefa(user, "Terceira");

    const titulos = screen
      .getAllByRole("listitem")
      .map((linha) => linha.textContent);
    expect(titulos).toEqual(["Primeira", "Segunda", "Terceira"]);
  });

  it("permite cadastrar duas tarefas com o mesmo título", async () => {
    const user = userEvent.setup();
    render(<App />);

    await adicionarTarefa(user, "Estudar");
    await adicionarTarefa(user, "Estudar");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("não cadastra nada quando o título é inválido", async () => {
    const user = userEvent.setup();
    render(<App />);

    await adicionarTarefa(user, "   ", "Só descrição");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O título é obrigatório.",
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeInTheDocument();
  });
});
