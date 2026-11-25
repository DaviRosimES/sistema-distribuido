import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimulacaoForm } from "../../src/components/SimulacaoForm";
import { API_URL } from "../../src/services/api";
import { resposta } from "../helpers/api";

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
      moeda: "BRL",
      valor: 250.5,
      preco_btc: 500000,
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

describe("SimulacaoForm buscando a cotação", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preenche o preço com a cotação da API e mostra a fonte", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      resposta(200, {
        preco_btc: 343635.12,
        fonte: "Binance",
        consultada_em: "2026-11-25T13:38:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Usar cotação atual" }),
    );

    expect(screen.getByLabelText("Preço do BTC (R$)")).toHaveValue(
      "343.635,12",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cotação da Binance às",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/cotacao?moeda=BRL`,
      undefined,
    );
  });

  it("mostra o 503 da API e deixa o campo pra preencher à mão", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        resposta(503, {
          detail:
            "Não foi possível obter a cotação agora. Informe o preço do BTC manualmente.",
        }),
      ),
    );
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Usar cotação atual" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe o preço do BTC manualmente",
    );
    expect(screen.getByLabelText("Preço do BTC (R$)")).toHaveValue("");
    expect(screen.getByLabelText("Preço do BTC (R$)")).toBeEnabled();
  });
});

describe("SimulacaoForm em dólar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("troca os rótulos, limpa o preço e busca a cotação em dólar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      resposta(200, {
        moeda: "USD",
        preco_btc: 58348.8,
        fonte: "Binance",
        consultada_em: "2026-11-25T14:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onSimular = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<SimulacaoForm onSimular={onSimular} />);
    await user.type(screen.getByLabelText("Preço do BTC (R$)"), "344.000");

    await user.selectOptions(screen.getByLabelText("Moeda"), "USD");

    expect(screen.getByLabelText("Preço do BTC (US$)")).toHaveValue("");
    await user.click(
      screen.getByRole("button", { name: "Usar cotação atual" }),
    );
    expect(screen.getByLabelText("Preço do BTC (US$)")).toHaveValue(
      "58.348,80",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/cotacao?moeda=USD`,
      undefined,
    );

    await user.type(screen.getByLabelText("Valor por compra (US$)"), "200");
    await user.click(
      screen.getByRole("button", { name: "Comparar corretoras" }),
    );
    expect(onSimular).toHaveBeenCalledWith(
      expect.objectContaining({ moeda: "USD", valor: 200, preco_btc: 58348.8 }),
    );
  });
});
