import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarefaForm } from "../../src/components/TarefaForm";
import { TITULO_MAX_LENGTH } from "../../src/validation";

// O vi.fn() faz o papel do App: dá pra ver se o formulário chamou o onSalvar e
// simular a resposta da API (resolvendo ou rejeitando a promise)
function renderizarFormulario(props = {}) {
  const user = userEvent.setup();
  const onSalvar = vi.fn().mockResolvedValue(undefined);
  render(<TarefaForm onSalvar={onSalvar} {...props} />);
  return { user, onSalvar };
}

function campoTitulo() {
  return screen.getByLabelText("Título");
}

function campoDescricao() {
  return screen.getByLabelText("Descrição");
}

describe("TarefaForm", () => {
  it("mostra os campos e o botão", () => {
    renderizarFormulario();

    expect(campoTitulo()).toBeInTheDocument();
    expect(campoDescricao()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("chama onSalvar com os valores sem espaços nas pontas", async () => {
    const { user, onSalvar } = renderizarFormulario();

    await user.type(campoTitulo(), "  Estudar ");
    await user.type(campoDescricao(), "Prática 7");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSalvar).toHaveBeenCalledOnce();
    expect(onSalvar).toHaveBeenCalledWith({
      titulo: "Estudar",
      descricao: "Prática 7",
    });
  });

  it("limpa os campos depois que a API salva", async () => {
    const { user } = renderizarFormulario();

    await user.type(campoTitulo(), "Estudar");
    await user.type(campoDescricao(), "Prática 7");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(campoTitulo()).toHaveValue("");
    expect(campoDescricao()).toHaveValue("");
  });

  it("mostra o erro da API e mantém o que foi digitado", async () => {
    const { user, onSalvar } = renderizarFormulario();
    onSalvar.mockRejectedValue(
      new Error("Já existe uma tarefa com esse título"),
    );

    await user.type(campoTitulo(), "Estudar");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma tarefa com esse título",
    );
    expect(campoTitulo()).toHaveValue("Estudar");
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto a API não responde", async () => {
    let responderApi;
    const { user, onSalvar } = renderizarFormulario();
    onSalvar.mockReturnValue(
      new Promise((resolve) => {
        responderApi = resolve;
      }),
    );

    await user.type(campoTitulo(), "Estudar");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();

    responderApi();

    expect(
      await screen.findByRole("button", { name: "Adicionar" }),
    ).toBeEnabled();
  });

  it("mostra erro e não chama onSalvar com título vazio", async () => {
    const { user, onSalvar } = renderizarFormulario();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O título é obrigatório.",
    );
    expect(campoTitulo()).toHaveAttribute("aria-invalid", "true");
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("mostra erro com título maior que o máximo", async () => {
    const { user, onSalvar } = renderizarFormulario();

    // paste em vez de type pra não digitar 101 caracteres um por um
    await user.click(campoTitulo());
    await user.paste("a".repeat(TITULO_MAX_LENGTH + 1));
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      `O título deve ter no máximo ${TITULO_MAX_LENGTH} caracteres.`,
    );
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("tira a mensagem de erro depois de um envio válido", async () => {
    const { user } = renderizarFormulario();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.type(campoTitulo(), "Estudar");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(campoTitulo()).toHaveAttribute("aria-invalid", "false");
  });
});

describe("TarefaForm na edição", () => {
  const edicao = {
    valoresIniciais: { titulo: "Estudar", descricao: null },
    rotuloBotao: "Salvar",
    limparAoSalvar: false,
  };

  it("começa preenchido com os valores da tarefa", () => {
    renderizarFormulario({ ...edicao, onCancelar: vi.fn() });

    expect(campoTitulo()).toHaveValue("Estudar");
    expect(campoDescricao()).toHaveValue("");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("não limpa os campos depois de salvar", async () => {
    const { user, onSalvar } = renderizarFormulario({
      ...edicao,
      onCancelar: vi.fn(),
    });

    await user.clear(campoTitulo());
    await user.type(campoTitulo(), "Revisar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSalvar).toHaveBeenCalledWith({ titulo: "Revisar", descricao: "" });
    expect(campoTitulo()).toHaveValue("Revisar");
  });

  it("chama onCancelar sem salvar", async () => {
    const onCancelar = vi.fn();
    const { user, onSalvar } = renderizarFormulario({ ...edicao, onCancelar });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalledOnce();
    expect(onSalvar).not.toHaveBeenCalled();
  });
});
