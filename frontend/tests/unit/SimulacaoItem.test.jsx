import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SimulacaoItem } from "../../src/components/SimulacaoItem";
import { itemRanking, simulacao } from "../helpers/simulacao";

function renderizar(dados = simulacao(), props = {}) {
  const acoes = {
    onAtualizar: vi.fn().mockResolvedValue(),
    onRemover: vi.fn().mockResolvedValue(),
  };
  render(
    <ul>
      <SimulacaoItem simulacao={dados} {...acoes} {...props} />
    </ul>,
  );
  return { acoes, user: userEvent.setup() };
}

describe("SimulacaoItem", () => {
  it("resume os parâmetros e a melhor corretora", () => {
    renderizar(simulacao({ compras_por_saque: 4 }));

    expect(screen.getByText("Simulação #1")).toBeInTheDocument();
    expect(
      screen.getByText(/saque on-chain a cada 4 compras/),
    ).toBeInTheDocument();
    expect(screen.getByText("Corretora A")).toBeInTheDocument();
  });

  it("avisa quando nenhuma corretora é viável", () => {
    renderizar(
      simulacao({ ranking: [itemRanking({ viavel: false, motivo: "x" })] }),
    );

    expect(
      screen.getByText("Nenhuma corretora viável para esses parâmetros"),
    ).toBeInTheDocument();
  });

  it("abre e fecha o ranking", async () => {
    const { user } = renderizar();

    expect(screen.queryByRole("table")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Ver ranking" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ocultar ranking" }));
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("edita só a descrição", async () => {
    const dados = simulacao();
    const { acoes, user } = renderizar(dados);

    await user.click(screen.getByRole("button", { name: "Editar descrição" }));
    await user.type(screen.getByLabelText("Descrição"), "Compra de dezembro");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(acoes.onAtualizar).toHaveBeenCalledWith(dados, {
      descricao: "Compra de dezembro",
    });
    expect(screen.queryByLabelText("Descrição")).toBeNull();
  });

  it("recalcula mandando um parâmetro do cálculo", async () => {
    const dados = simulacao();
    const { acoes, user } = renderizar(dados);

    await user.click(
      screen.getByRole("button", { name: "Recalcular com taxas atuais" }),
    );

    expect(acoes.onAtualizar).toHaveBeenCalledWith(dados, { valor_brl: 1000 });
  });

  it("mostra o erro da API ao remover", async () => {
    const { acoes, user } = renderizar();
    acoes.onRemover.mockRejectedValue(new Error("Simulação 1 não encontrada"));

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Simulação 1 não encontrada",
    );
  });
});
