import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TarefaList } from "../../src/components/TarefaList";

describe("TarefaList", () => {
  it("mostra a mensagem de lista vazia quando não há tarefas", () => {
    render(<TarefaList tarefas={[]} />);

    expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("mostra uma linha por tarefa, na ordem recebida", () => {
    render(
      <TarefaList
        tarefas={[
          { id: "1", titulo: "Estudar", descricao: "Prática 6" },
          { id: "2", titulo: "Revisar", descricao: "" },
        ]}
      />,
    );

    const linhas = screen.getAllByRole("listitem");

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Estudar");
    expect(linhas[0]).toHaveTextContent("Prática 6");
    expect(linhas[1]).toHaveTextContent("Revisar");
  });

  it("não renderiza o parágrafo de descrição quando ela está vazia", () => {
    render(
      <TarefaList tarefas={[{ id: "1", titulo: "Revisar", descricao: "" }]} />,
    );

    const linha = screen.getByRole("listitem");

    // Só o parágrafo do título, sem um <p> vazio pra descrição
    expect(linha.querySelectorAll("p")).toHaveLength(1);
  });
});
