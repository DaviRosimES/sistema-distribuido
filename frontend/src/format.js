// Formatação pt-BR dos números que vêm da API

// Uma formatação por moeda: em pt-BR o real sai "R$ 1.000,00" e o dólar "US$ 1.000,00"
const dinheiro = {
  BRL: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  USD: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }),
};

export const SIMBOLO_MOEDA = { BRL: "R$", USD: "US$" };
const inteiro = new Intl.NumberFormat("pt-BR");
const percentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export function formatarMoeda(valor, moeda = "BRL") {
  return dinheiro[moeda].format(valor);
}

export function formatarSats(valor) {
  return `${inteiro.format(valor)} sats`;
}

export function formatarPct(valor) {
  return `${percentual.format(valor)}%`;
}

export function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Número com 2 casas no formato que o campo aceita de volta ("343.635,12")
const decimal2 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatarDecimal(valor) {
  return decimal2.format(valor);
}

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
