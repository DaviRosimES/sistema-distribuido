// Formatação pt-BR dos números que vêm da API

const reais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const inteiro = new Intl.NumberFormat("pt-BR");
const percentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export function formatarReais(valor) {
  return reais.format(valor);
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
