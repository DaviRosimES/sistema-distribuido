import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarefaForm } from "../../src/components/TarefaForm";
import { TITULO_MAX_LENGTH } from "../../src/validation";

// O vi.fn() faz o papel do App: dá pra ver se o formulário chamou ou não o onAdicionar
function renderizarFormulario() {
  const user = userEvent.setup();
  const onAdicionar = vi.fn();
  render(<TarefaForm onAdicionar={onAdicionar} />);
  return { user, onAdicionar };
}

describe("TarefaForm", () => {
  it("mostra os campos e o botão", () => {
    renderizarFormulario();

    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar" }),
    ).toBeInTheDocument();
  });

  it("chama onAdicionar com os valores sem espaços nas pontas", async () => {
    const { user, onAdicionar } = renderizarFormulario();

    await user.type(screen.getByLabelText("Título"), "  Estudar ");
    await user.type(screen.getByLabelText("Descrição"), "Prática 6");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdicionar).toHaveBeenCalledOnce();
    expect(onAdicionar).toHaveBeenCalledWith({
      titulo: "Estudar",
      descricao: "Prática 6",
    });
  });

  it("limpa os campos depois de adicionar", async () => {
    const { user } = renderizarFormulario();

    await user.type(screen.getByLabelText("Título"), "Estudar");
    await user.type(screen.getByLabelText("Descrição"), "Prática 6");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("mostra erro e não chama onAdicionar com título vazio", async () => {
    const { user, onAdicionar } = renderizarFormulario();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O título é obrigatório.",
    );
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onAdicionar).not.toHaveBeenCalled();
  });

  it("mostra erro com título maior que o máximo", async () => {
    const { user, onAdicionar } = renderizarFormulario();

    // paste em vez de type pra não digitar 101 caracteres um por um
    await user.click(screen.getByLabelText("Título"));
    await user.paste("a".repeat(TITULO_MAX_LENGTH + 1));
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      `O título deve ter no máximo ${TITULO_MAX_LENGTH} caracteres.`,
    );
    expect(onAdicionar).not.toHaveBeenCalled();
  });

  it("mantém o que foi digitado quando a validação falha", async () => {
    const { user } = renderizarFormulario();

    await user.type(screen.getByLabelText("Descrição"), "Sem título");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByLabelText("Descrição")).toHaveValue("Sem título");
  });

  it("tira a mensagem de erro depois de um envio válido", async () => {
    const { user } = renderizarFormulario();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.type(screen.getByLabelText("Título"), "Estudar");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });
});
