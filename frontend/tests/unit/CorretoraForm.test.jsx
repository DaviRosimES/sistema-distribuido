import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CorretoraForm } from "../../src/components/CorretoraForm";

async function preencher(user, valores) {
  for (const [rotulo, valor] of Object.entries(valores)) {
    await user.type(screen.getByLabelText(rotulo), valor);
  }
}

const BASICO = {
  Nome: "Corretora A",
  "Taxa de negociação (%)": "0,5",
  "Spread (%)": "1",
  "Taxa de saque on-chain (sats)": "20000",
};

describe("CorretoraForm", () => {
  it("envia os valores convertidos e limpa o formulário no cadastro", async () => {
    const onSalvar = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<CorretoraForm onSalvar={onSalvar} />);

    await preencher(user, BASICO);
    await user.click(
      screen.getByRole("button", { name: "Cadastrar corretora" }),
    );

    expect(onSalvar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Corretora A",
        taxa_negociacao_pct: 0.5,
        taxa_saque_onchain_sats: 20000,
        suporta_lightning: false,
        taxa_saque_lightning_sats: null,
      }),
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("só mostra a taxa Lightning quando a corretora saca pela Lightning", async () => {
    const user = userEvent.setup();
    render(<CorretoraForm onSalvar={vi.fn()} />);

    expect(
      screen.queryByLabelText("Taxa de saque Lightning (sats)"),
    ).toBeNull();
    await user.click(screen.getByLabelText("Saca pela Lightning"));

    expect(
      screen.getByLabelText("Taxa de saque Lightning (sats)"),
    ).toBeInTheDocument();
  });

  it("não chama a API e mostra os erros quando a validação barra", async () => {
    const onSalvar = vi.fn();
    const user = userEvent.setup();
    render(<CorretoraForm onSalvar={onSalvar} />);

    await preencher(user, { ...BASICO, "Spread (%)": "15" });
    await user.click(screen.getByLabelText("Saca pela Lightning"));
    await user.click(
      screen.getByRole("button", { name: "Cadastrar corretora" }),
    );

    expect(onSalvar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Spread (%)")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Deve ser no máximo 10.")).toBeInTheDocument();
    expect(screen.getByText("Campo obrigatório.")).toBeInTheDocument();
  });

  it("mostra o erro da API e mantém o que foi digitado", async () => {
    const onSalvar = vi
      .fn()
      .mockRejectedValue(new Error("Já existe uma corretora com esse nome"));
    const user = userEvent.setup();
    render(<CorretoraForm onSalvar={onSalvar} />);

    await preencher(user, BASICO);
    await user.click(
      screen.getByRole("button", { name: "Cadastrar corretora" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma corretora com esse nome",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Corretora A");
  });

  it("na edição começa com os valores da corretora", () => {
    render(
      <CorretoraForm
        onSalvar={vi.fn()}
        rotuloBotao="Salvar"
        corretora={{
          id: 1,
          nome: "Corretora A",
          taxa_negociacao_pct: 0.125,
          spread_pct: 1,
          taxa_saque_onchain_sats: 20000,
          saque_minimo_sats: 0,
          suporta_lightning: true,
          taxa_saque_lightning_sats: 10,
          ativa: false,
          observacoes: null,
        }}
      />,
    );

    expect(screen.getByLabelText("Taxa de negociação (%)")).toHaveValue(
      "0.125",
    );
    expect(screen.getByLabelText("Taxa de saque Lightning (sats)")).toHaveValue(
      "10",
    );
    expect(
      screen.getByLabelText("Ativa (entra nas simulações)"),
    ).not.toBeChecked();
  });
});
