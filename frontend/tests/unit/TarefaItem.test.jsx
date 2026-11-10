import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarefaItem } from "../../src/components/TarefaItem";

const TAREFA = {
  id: 1,
  titulo: "Estudar",
  descricao: "Prática 7",
  concluida: false,
};

function renderizarItem(tarefa = TAREFA) {
  const user = userEvent.setup();
  const handlers = {
    onAlternarConcluida: vi.fn().mockResolvedValue(undefined),
    onEditar: vi.fn().mockResolvedValue(undefined),
    onRemover: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <ul>
      <TarefaItem tarefa={tarefa} {...handlers} />
    </ul>,
  );
  return { user, ...handlers };
}

describe("TarefaItem", () => {
  it("mostra título, descrição e o status da tarefa", () => {
    renderizarItem();

    expect(screen.getByRole("checkbox", { name: "Estudar" })).not.toBeChecked();
    expect(screen.getByText("Prática 7")).toBeInTheDocument();
  });

  it("marca a caixa e risca o título quando a tarefa está concluída", () => {
    renderizarItem({ ...TAREFA, concluida: true });

    expect(screen.getByRole("checkbox", { name: "Estudar" })).toBeChecked();
    expect(screen.getByText("Estudar")).toHaveClass("line-through");
  });

  it("não mostra descrição quando ela é null", () => {
    renderizarItem({ ...TAREFA, descricao: null });

    expect(screen.queryByText("Prática 7")).not.toBeInTheDocument();
  });

  it("chama onAlternarConcluida ao clicar na caixa", async () => {
    const { user, onAlternarConcluida } = renderizarItem();

    await user.click(screen.getByRole("checkbox", { name: "Estudar" }));

    expect(onAlternarConcluida).toHaveBeenCalledWith(TAREFA);
  });

  it("trava os controles enquanto a API não responde", async () => {
    const { user, onRemover } = renderizarItem();
    onRemover.mockReturnValue(new Promise(() => {}));

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remover" })).toBeDisabled();
  });

  it("chama onRemover ao clicar em Remover", async () => {
    const { user, onRemover } = renderizarItem();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(onRemover).toHaveBeenCalledWith(TAREFA);
  });

  it("abre a edição preenchida e salva com onEditar", async () => {
    const { user, onEditar } = renderizarItem();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Estudar");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Prática 7");

    await user.clear(screen.getByLabelText("Título"));
    await user.type(screen.getByLabelText("Título"), "Revisar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onEditar).toHaveBeenCalledWith(TAREFA, {
      titulo: "Revisar",
      descricao: "Prática 7",
    });
    // Depois de salvar volta pra visualização
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("continua editando e mostra o erro quando a API recusa", async () => {
    const { user, onEditar } = renderizarItem();
    onEditar.mockRejectedValue(
      new Error("Já existe uma tarefa com esse título"),
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma tarefa com esse título",
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("volta pra visualização ao cancelar, sem salvar", async () => {
    const { user, onEditar } = renderizarItem();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onEditar).not.toHaveBeenCalled();
    expect(
      screen.getByRole("checkbox", { name: "Estudar" }),
    ).toBeInTheDocument();
  });
});
