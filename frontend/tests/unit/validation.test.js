import { describe, expect, it } from "vitest";
import {
  lerNumero,
  validarCorretora,
  validarSimulacao,
} from "../../src/validation";

const CORRETORA = {
  nome: "  Corretora A ",
  taxa_negociacao_pct: "0,5",
  spread_pct: "1",
  taxa_saque_onchain_sats: "20000",
  saque_minimo_sats: "",
  suporta_lightning: false,
  taxa_saque_lightning_sats: "123",
  ativa: true,
  observacoes: "",
};

const SIMULACAO = {
  descricao: "",
  moeda: "BRL",
  valor: "1.000,00",
  preco_btc: "500000",
  rede: "onchain",
  compras_por_saque: "1",
  custo_alvo_pct: "1",
};

describe("lerNumero", () => {
  it.each([
    ["0,5", 0.5],
    ["1.234,56", 1234.56],
    ["500.000", 500000],
    ["1234.5", 1234.5],
    [" 42 ", 42],
    ["abc", null],
    ["1,2,3", null],
    ["", null],
  ])("%j vira %j", (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });
});

describe("validarCorretora", () => {
  it("converte o formulário no corpo da API", () => {
    const { erros, valores } = validarCorretora(CORRETORA);

    expect(erros).toEqual({});
    expect(valores).toEqual({
      nome: "Corretora A",
      taxa_negociacao_pct: 0.5,
      spread_pct: 1,
      taxa_saque_onchain_sats: 20000,
      saque_minimo_sats: 0,
      suporta_lightning: false,
      // Sem Lightning a taxa não vai, mesmo que o campo tenha sobrado preenchido
      taxa_saque_lightning_sats: null,
      ativa: true,
      observacoes: null,
    });
  });

  it("exige a taxa Lightning quando a corretora suporta Lightning", () => {
    const { erros } = validarCorretora({
      ...CORRETORA,
      suporta_lightning: true,
      taxa_saque_lightning_sats: "",
    });

    expect(erros.taxa_saque_lightning_sats).toBe("Campo obrigatório.");
  });

  it.each([
    ["nome", "   ", "O nome é obrigatório."],
    ["nome", "a".repeat(61), "O nome deve ter no máximo 60 caracteres."],
    ["taxa_negociacao_pct", "-1", "Deve ser no mínimo 0."],
    ["spread_pct", "10,5", "Deve ser no máximo 10."],
    ["spread_pct", "0,1234", "Use no máximo 3 casas decimais."],
    ["spread_pct", "muito", "Informe um número."],
    ["taxa_saque_onchain_sats", "", "Campo obrigatório."],
    ["taxa_saque_onchain_sats", "10,5", "Informe um número inteiro."],
  ])("%s = %j dá o erro %j", (campo, valor, mensagem) => {
    const { erros } = validarCorretora({ ...CORRETORA, [campo]: valor });

    expect(erros[campo]).toBe(mensagem);
  });
});

describe("validarSimulacao", () => {
  it("converte o formulário no corpo da API", () => {
    const { erros, valores } = validarSimulacao(SIMULACAO);

    expect(erros).toEqual({});
    expect(valores).toEqual({
      descricao: null,
      moeda: "BRL",
      valor: 1000,
      preco_btc: 500000,
      rede: "onchain",
      compras_por_saque: 1,
      custo_alvo_pct: 1,
    });
  });

  it.each([
    ["valor", "0", "Deve ser maior que 0."],
    ["valor", "10,001", "Use no máximo 2 casas decimais."],
    ["preco_btc", "", "Campo obrigatório."],
    ["compras_por_saque", "0", "Deve ser no mínimo 1."],
    ["compras_por_saque", "53", "Deve ser no máximo 52."],
    ["custo_alvo_pct", "0", "Deve ser maior que 0."],
  ])("%s = %j dá o erro %j", (campo, valor, mensagem) => {
    const { erros } = validarSimulacao({ ...SIMULACAO, [campo]: valor });

    expect(erros[campo]).toBe(mensagem);
  });
});
