import { useId, useState } from "react";
import { formatarDecimal, formatarHora } from "../format";
import { obterCotacao } from "../services/cotacao";
import { validarSimulacao } from "../validation";
import { Aviso } from "./Aviso";
import { Campo } from "./Campo";

const INICIAL = {
  descricao: "",
  valor_brl: "",
  preco_btc_brl: "",
  rede: "onchain",
  compras_por_saque: "1",
  custo_alvo_pct: "1",
};

export function SimulacaoForm({ onSimular }) {
  const id = useId();
  const [form, setForm] = useState(INICIAL);
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [simulando, setSimulando] = useState(false);
  const [buscandoCotacao, setBuscandoCotacao] = useState(false);
  const [cotacaoInfo, setCotacaoInfo] = useState("");
  const [erroCotacao, setErroCotacao] = useState("");

  function alterar(campo) {
    return (event) =>
      setForm((atual) => ({ ...atual, [campo]: event.target.value }));
  }

  // Preenche o preço com a cotação que a API buscou. Se falhar, o campo continua
  // editável e a pessoa digita o preço à mão.
  async function usarCotacaoAtual() {
    setBuscandoCotacao(true);
    setCotacaoInfo("");
    setErroCotacao("");
    try {
      const cotacao = await obterCotacao();
      setForm((atual) => ({
        ...atual,
        preco_btc_brl: formatarDecimal(cotacao.preco_btc_brl),
      }));
      setErros((atuais) => ({ ...atuais, preco_btc_brl: undefined }));
      setCotacaoInfo(
        `Cotação da ${cotacao.fonte} às ${formatarHora(cotacao.consultada_em)}.`,
      );
    } catch (erro) {
      setErroCotacao(erro.message);
    } finally {
      setBuscandoCotacao(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarSimulacao(form);
    setErros(resultado.erros);
    setErroApi("");
    if (Object.keys(resultado.erros).length > 0) return;

    setSimulando(true);
    try {
      // Os parâmetros continuam no formulário pra dar pra comparar variações rapidamente
      await onSimular(resultado.valores);
      setForm((atual) => ({ ...atual, descricao: "" }));
    } catch (erro) {
      setErroApi(erro.message);
    } finally {
      setSimulando(false);
    }
  }

  const campo = (nome) => ({
    id: `${id}-${nome}`,
    value: form[nome],
    onChange: alterar(nome),
    erro: erros[nome],
  });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Nova simulação"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Valor por compra (R$)"
          inputMode="decimal"
          placeholder="1.000,00"
          {...campo("valor_brl")}
        />
        <div className="space-y-2">
          <Campo
            rotulo="Preço do BTC (R$)"
            inputMode="decimal"
            placeholder="500.000,00"
            ajuda="Usado pra converter as taxas em sats"
            {...campo("preco_btc_brl")}
          />
          <button
            type="button"
            onClick={usarCotacaoAtual}
            disabled={buscandoCotacao}
            className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
          >
            {buscandoCotacao ? "Buscando cotação..." : "Usar cotação atual"}
          </button>
          <Aviso tipo="sucesso">{cotacaoInfo}</Aviso>
          <Aviso>{erroCotacao}</Aviso>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-rede`} className="block text-sm font-medium">
            Rede do saque
          </label>
          <select
            id={`${id}-rede`}
            value={form.rede}
            onChange={alterar("rede")}
            className="w-full rounded border border-slate-300 bg-white p-2"
          >
            <option value="onchain">On-chain</option>
            <option value="lightning">Lightning</option>
          </select>
        </div>
        <Campo
          rotulo="Compras por saque"
          inputMode="numeric"
          ajuda="Ex.: 4 = compra toda semana e saca uma vez por mês"
          {...campo("compras_por_saque")}
        />
        <Campo
          rotulo="Custo máximo aceitável (%)"
          inputMode="decimal"
          ajuda="Usado pra calcular o valor mínimo que vale a pena em cada corretora"
          {...campo("custo_alvo_pct")}
        />
        <Campo
          rotulo="Descrição (opcional)"
          autoComplete="off"
          {...campo("descricao")}
        />
      </div>

      <Aviso>{erroApi}</Aviso>

      <button
        type="submit"
        disabled={simulando}
        className="w-full rounded bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {simulando ? "Calculando..." : "Comparar corretoras"}
      </button>
    </form>
  );
}
