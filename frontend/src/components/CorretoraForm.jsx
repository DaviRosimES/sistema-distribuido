import { useId, useState } from "react";
import { botao, botaoPrimario, entrada, painel, rotulo } from "../ui";
import { validarCorretora } from "../validation";
import { Aviso } from "./Aviso";
import { Campo } from "./Campo";

const VAZIO = {
  nome: "",
  taxa_negociacao_pct: "",
  spread_pct: "",
  taxa_saque_onchain_sats: "",
  saque_minimo_sats: "",
  suporta_lightning: false,
  taxa_saque_lightning_sats: "",
  ativa: true,
  observacoes: "",
};

// Os inputs trabalham com texto; a corretora da API vem com números e null
function paraFormulario(corretora) {
  if (!corretora) return VAZIO;
  const texto = (valor) =>
    valor === null || valor === undefined ? "" : String(valor);
  return {
    nome: corretora.nome,
    taxa_negociacao_pct: texto(corretora.taxa_negociacao_pct),
    spread_pct: texto(corretora.spread_pct),
    taxa_saque_onchain_sats: texto(corretora.taxa_saque_onchain_sats),
    saque_minimo_sats: texto(corretora.saque_minimo_sats),
    suporta_lightning: corretora.suporta_lightning,
    taxa_saque_lightning_sats: texto(corretora.taxa_saque_lightning_sats),
    ativa: corretora.ativa,
    observacoes: texto(corretora.observacoes),
  };
}

// O mesmo formulário serve pra cadastrar e pra editar: na edição ele recebe a corretora,
// o rótulo "Salvar" e o onCancelar
export function CorretoraForm({
  onSalvar,
  corretora,
  rotuloBotao = "Cadastrar corretora",
  embutido = false,
  onCancelar,
}) {
  // useId porque pode ter mais de um formulário na tela (cadastro + edição)
  const id = useId();
  const [form, setForm] = useState(() => paraFormulario(corretora));
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(campo) {
    return (event) => {
      const { type, checked, value } = event.target;
      setForm((atual) => ({
        ...atual,
        [campo]: type === "checkbox" ? checked : value,
      }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarCorretora(form);
    setErros(resultado.erros);
    setErroApi("");
    // Se a validação do front já barrou, a requisição nem é feita
    if (Object.keys(resultado.erros).length > 0) return;

    setSalvando(true);
    try {
      await onSalvar(resultado.valores);
      if (!corretora) setForm(VAZIO);
    } catch (erro) {
      // Erro vindo da API (nome repetido, sem conexão...): mostra a mensagem e
      // mantém o que foi digitado pra pessoa não ter que preencher de novo
      setErroApi(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  const campo = (nome) => ({
    id: `${id}-${nome}`,
    value: form[nome],
    onChange: alterar(nome),
    erro: erros[nome],
  });

  // noValidate desliga a validação nativa do navegador, pra mensagem de erro ser sempre a nossa
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={corretora ? `Editar ${corretora.nome}` : "Nova corretora"}
      className={embutido ? "space-y-4" : `${painel} space-y-4 p-4 sm:p-5`}
    >
      <Campo rotulo="Nome" autoComplete="off" {...campo("nome")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Taxa de negociação (%)"
          inputMode="decimal"
          ajuda="Cobrada sobre o valor da compra"
          {...campo("taxa_negociacao_pct")}
        />
        <Campo
          rotulo="Spread (%)"
          inputMode="decimal"
          ajuda="Diferença entre o preço cobrado e o de mercado"
          {...campo("spread_pct")}
        />
        <Campo
          rotulo="Taxa de saque on-chain (sats)"
          inputMode="numeric"
          {...campo("taxa_saque_onchain_sats")}
        />
        <Campo
          rotulo="Saque mínimo (sats)"
          inputMode="numeric"
          ajuda="Deixe vazio se não houver"
          {...campo("saque_minimo_sats")}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.suporta_lightning}
            onChange={alterar("suporta_lightning")}
            className="size-4 accent-zinc-900 dark:accent-zinc-100"
          />
          Saca pela Lightning
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.ativa}
            onChange={alterar("ativa")}
            className="size-4 accent-zinc-900 dark:accent-zinc-100"
          />
          Ativa (entra nas simulações)
        </label>
      </div>

      {form.suporta_lightning && (
        <Campo
          rotulo="Taxa de saque Lightning (sats)"
          inputMode="numeric"
          {...campo("taxa_saque_lightning_sats")}
        />
      )}

      <div className="space-y-1">
        <label htmlFor={`${id}-observacoes`} className={rotulo}>
          Observações
        </label>
        <textarea
          id={`${id}-observacoes`}
          value={form.observacoes}
          onChange={alterar("observacoes")}
          rows={2}
          aria-invalid={erros.observacoes ? "true" : "false"}
          className={entrada}
        />
        {erros.observacoes && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {erros.observacoes}
          </p>
        )}
      </div>

      <Aviso>{erroApi}</Aviso>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={salvando} className={botaoPrimario}>
          {salvando ? "Salvando..." : rotuloBotao}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className={`${botao} justify-center py-2`}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
