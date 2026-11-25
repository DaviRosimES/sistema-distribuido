import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CorretoraItem } from "../../src/components/CorretoraItem";

const CORRETORA = {
  id: 1,
  nome: "Corretora A",
  taxa_negociacao_pct: 0.5,
  spread_pct: 1,
  taxa_saque_onchain_sats: 20000,
  saque_minimo_sats: 0,
  suporta_lightning: true,
  taxa_saque_lightning_sats: 10,
  ativa: true,
  observacoes: "Sem taxa de depósito",
};

function renderizar(corretora = CORRETORA) {
  const acoes = {
    onEditar: vi.fn().mockResolvedValue(),
    onAlternarAtiva: vi.fn().mockResolvedValue(),
    onRemover: vi.fn().mockResolvedValue(),
  };
  render(
    <ul>
      <CorretoraItem corretora={corretora} {...acoes} />
    </ul>,
  );
  return { acoes, user: userEvent.setup() };
}

describe("CorretoraItem", () => {
  it("mostra as taxas formatadas", () => {
    renderizar();

    expect(screen.getByText("0,5%")).toBeInTheDocument();
    expect(screen.getByText("20.000 sats")).toBeInTheDocument();
    expect(screen.getByText("10 sats")).toBeInTheDocument();
    expect(screen.getByText("Lightning")).toBeInTheDocument();
    expect(screen.getByText("Sem taxa de depósito")).toBeInTheDocument();
  });

  it("marca a corretora inativa e oferece ativar", () => {
    renderizar({ ...CORRETORA, ativa: false });

    expect(screen.getByText("Inativa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar" })).toBeInTheDocument();
  });

  it("chama as ações de desativar e remover", async () => {
    const { acoes, user } = renderizar();

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(acoes.onAlternarAtiva).toHaveBeenCalledWith(CORRETORA);
    expect(acoes.onRemover).toHaveBeenCalledWith(CORRETORA);
  });

  it("abre a edição e fecha depois de salvar", async () => {
    const { acoes, user } = renderizar();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Spread (%)"));
    await user.type(screen.getByLabelText("Spread (%)"), "0,8");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(acoes.onEditar).toHaveBeenCalledWith(
      CORRETORA,
      expect.objectContaining({ spread_pct: 0.8 }),
    );
    expect(
      await screen.findByRole("button", { name: "Editar" }),
    ).toBeInTheDocument();
  });
});
