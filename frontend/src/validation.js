// Mesmas regras dos schemas do backend
// (backend/app/schemas/corretora.py e simulacao.py), assim o front já barra o que a
// API recusaria com 422 e a mensagem sai em português, do lado do campo.

export const NOME_MAX_LENGTH = 60;
export const OBSERVACOES_MAX_LENGTH = 500;
export const DESCRICAO_SIMULACAO_MAX_LENGTH = 100;
const PERCENTUAL_MAX = 10;
const SATS_MAX = 10_000_000;
const SAQUE_MINIMO_MAX = 100_000_000;
const REAIS_MAX = 100_000_000;
const COMPRAS_POR_SAQUE_MAX = 52;

// Aceita o jeito brasileiro ("1.234,56" e "0,5") e o jeito do input ("1234.56").
// Devolve null quando não é um número.
export function lerNumero(texto) {
  let limpo = String(texto).trim().replace(/\s/g, "");
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // "500.000" sem vírgula é milhar, não decimal
    limpo = limpo.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null;
  return Number(limpo);
}

function casasDecimais(numero) {
  const [, decimais = ""] = String(numero).split(".");
  return decimais.length;
}

// Cada validador devolve [valor, mensagem de erro]; só um dos dois vem preenchido
function numeroDecimal(texto, { min, max, casas, maiorQueMin = false }) {
  const numero = lerNumero(texto);
  if (texto.trim() === "") return [null, "Campo obrigatório."];
  if (numero === null) return [null, "Informe um número."];
  if (maiorQueMin ? numero <= min : numero < min) {
    return [
      null,
      maiorQueMin ? `Deve ser maior que ${min}.` : `Deve ser no mínimo ${min}.`,
    ];
  }
  if (numero > max)
    return [null, `Deve ser no máximo ${max.toLocaleString("pt-BR")}.`];
  if (casasDecimais(numero) > casas)
    return [null, `Use no máximo ${casas} casas decimais.`];
  return [numero, null];
}

function numeroInteiro(texto, { min, max }) {
  const [numero, erro] = numeroDecimal(texto, { min, max, casas: 0 });
  if (erro === "Use no máximo 0 casas decimais.")
    return [null, "Informe um número inteiro."];
  return [numero, erro];
}

function juntar(campos) {
  const erros = {};
  const valores = {};
  for (const [campo, [valor, erro]] of Object.entries(campos)) {
    if (erro) erros[campo] = erro;
    else valores[campo] = valor;
  }
  return { erros, valores };
}

// Recebe os textos do formulário e devolve os erros por campo e o corpo pronto pra API
export function validarCorretora(form) {
  const nome = form.nome.trim();
  const observacoes = form.observacoes.trim();
  const percentual = { min: 0, max: PERCENTUAL_MAX, casas: 3 };

  const campos = {
    nome: !nome
      ? [null, "O nome é obrigatório."]
      : nome.length > NOME_MAX_LENGTH
        ? [null, `O nome deve ter no máximo ${NOME_MAX_LENGTH} caracteres.`]
        : [nome, null],
    taxa_negociacao_pct: numeroDecimal(form.taxa_negociacao_pct, percentual),
    spread_pct: numeroDecimal(form.spread_pct, percentual),
    taxa_saque_onchain_sats: numeroInteiro(form.taxa_saque_onchain_sats, {
      min: 0,
      max: SATS_MAX,
    }),
    // Saque mínimo é opcional: vazio vira 0
    saque_minimo_sats:
      form.saque_minimo_sats.trim() === ""
        ? [0, null]
        : numeroInteiro(form.saque_minimo_sats, {
            min: 0,
            max: SAQUE_MINIMO_MAX,
          }),
    suporta_lightning: [form.suporta_lightning, null],
    // Regra de negócio igual à do service: com Lightning a taxa é obrigatória; sem, vai null
    taxa_saque_lightning_sats: form.suporta_lightning
      ? numeroInteiro(form.taxa_saque_lightning_sats, { min: 0, max: SATS_MAX })
      : [null, null],
    ativa: [form.ativa, null],
    observacoes:
      observacoes.length > OBSERVACOES_MAX_LENGTH
        ? [
            null,
            `As observações devem ter no máximo ${OBSERVACOES_MAX_LENGTH} caracteres.`,
          ]
        : [observacoes || null, null],
  };
  return juntar(campos);
}

export function validarSimulacao(form) {
  const descricao = form.descricao.trim();
  const campos = {
    descricao:
      descricao.length > DESCRICAO_SIMULACAO_MAX_LENGTH
        ? [
            null,
            `A descrição deve ter no máximo ${DESCRICAO_SIMULACAO_MAX_LENGTH} caracteres.`,
          ]
        : [descricao || null, null],
    valor: numeroDecimal(form.valor, {
      min: 0,
      max: REAIS_MAX,
      casas: 2,
      maiorQueMin: true,
    }),
    preco_btc: numeroDecimal(form.preco_btc, {
      min: 0,
      max: REAIS_MAX,
      casas: 2,
      maiorQueMin: true,
    }),
    rede: ["onchain", "lightning"].includes(form.rede)
      ? [form.rede, null]
      : [null, "Escolha a rede."],
    compras_por_saque: numeroInteiro(form.compras_por_saque, {
      min: 1,
      max: COMPRAS_POR_SAQUE_MAX,
    }),
    custo_alvo_pct: numeroDecimal(form.custo_alvo_pct, {
      min: 0,
      max: 100,
      casas: 3,
      maiorQueMin: true,
    }),
  };
  return juntar(campos);
}
