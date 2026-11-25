import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SimulacaoForm } from "../../src/components/SimulacaoForm";

describe("SimulacaoForm", () => {
  it("envia os parâmetros convertidos", async () => {
    const onSimular = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={onSimular} />);

    await user.type(screen.getByLabelText("Valor por compra (R$)"), "250,50");
    await user.type(screen.getByLabelText("Preço do BTC (R$)"), "500.000");
    await user.selectOptions(
      screen.getByLabelText("Rede do saque"),
      "lightning",
    );
    await user.clear(screen.getByLabelText("Compras por saque"));
    await user.type(screen.getByLabelText("Compras por saque"), "4");
    await user.click(
      screen.getByRole("button", { name: "Comparar corretoras" }),
    );

    expect(onSimular).toHaveBeenCalledWith({
      descricao: null,
      valor_brl: 250.5,
      preco_btc_brl: 500000,
      rede: "lightning",
      compras_por_saque: 4,
      custo_alvo_pct: 1,
    });
    // Os parâmetros continuam preenchidos pra comparar variações
    expect(screen.getByLabelText("Valor por compra (R$)")).toHaveValue(
      "250,50",
    );
  });

  it("não simula com campos inválidos", async () => {
    const onSimular = vi.fn();
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={onSimular} />);

    await user.click(
      screen.getByRole("button", { name: "Comparar corretoras" }),
    );

    expect(onSimular).not.toHaveBeenCalled();
    expect(screen.getAllByText("Campo obrigatório.")).toHaveLength(2);
  });

  it("mostra o erro da API", async () => {
    const onSimular = vi
      .fn()
      .mockRejectedValue(
        new Error("Cadastre pelo menos uma corretora ativa antes de simular"),
      );
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={onSimular} />);

    await user.type(screen.getByLabelText("Valor por compra (R$)"), "100");
    await user.type(screen.getByLabelText("Preço do BTC (R$)"), "500000");
    await user.click(
      screen.getByRole("button", { name: "Comparar corretoras" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cadastre pelo menos uma corretora ativa",
    );
  });
});
