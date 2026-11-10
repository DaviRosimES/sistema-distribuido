import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TarefaList } from "../../src/components/TarefaList";

function renderizarLista(tarefas) {
  render(
    <TarefaList
      tarefas={tarefas}
      onAlternarConcluida={vi.fn()}
      onEditar={vi.fn()}
      onRemover={vi.fn()}
    />,
  );
}

describe("TarefaList", () => {
  it("mostra a mensagem de lista vazia quando não há tarefas", () => {
    renderizarLista([]);

    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("mostra uma linha por tarefa, na ordem recebida", () => {
    renderizarLista([
      { id: 1, titulo: "Estudar", descricao: "Prática 7", concluida: false },
      { id: 2, titulo: "Revisar", descricao: null, concluida: true },
    ]);

    const linhas = screen.getAllByRole("listitem");

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Estudar");
    expect(linhas[0]).toHaveTextContent("Prática 7");
    expect(linhas[1]).toHaveTextContent("Revisar");
  });
});
