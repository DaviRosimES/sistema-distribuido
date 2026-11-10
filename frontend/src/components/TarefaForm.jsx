import { useId, useState } from "react";
import { validarTarefa } from "../validation";

const VAZIO = { titulo: "", descricao: "" };

// O mesmo formulário serve pra cadastrar e pra editar: na edição ele recebe os valores
// iniciais, o rótulo "Salvar" e o onCancelar
export function TarefaForm({
  onSalvar,
  valoresIniciais = VAZIO,
  rotuloBotao = "Adicionar",
  onCancelar,
  limparAoSalvar = true,
}) {
  // useId porque pode ter mais de um formulário na tela (cadastro + edição)
  const id = useId();
  const [titulo, setTitulo] = useState(valoresIniciais.titulo);
  const [descricao, setDescricao] = useState(valoresIniciais.descricao ?? "");
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarTarefa({ titulo, descricao });
    setErros(resultado.erros);
    setErroApi("");
    // Se a validação do front já barrou, a requisição nem é feita
    if (Object.keys(resultado.erros).length > 0) return;

    setSalvando(true);
    try {
      await onSalvar(resultado.valores);
      if (limparAoSalvar) {
        setTitulo("");
        setDescricao("");
      }
    } catch (erro) {
      // Erro vindo da API (título repetido, sem conexão...): mostra a mensagem e
      // mantém o que foi digitado pra pessoa não ter que preencher de novo
      setErroApi(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  // noValidate desliga a validação nativa do navegador, pra mensagem de erro ser sempre a nossa
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor={`${id}-titulo`} className="block text-sm font-medium">
          Título
        </label>
        <input
          id={`${id}-titulo`}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          aria-invalid={erros.titulo ? "true" : "false"}
          aria-describedby={erros.titulo ? `${id}-titulo-erro` : undefined}
          className="w-full rounded border border-slate-300 p-2 aria-[invalid=true]:border-red-600"
        />
        {erros.titulo && (
          <p
            id={`${id}-titulo-erro`}
            role="alert"
            className="text-sm text-red-700"
          >
            {erros.titulo}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${id}-descricao`}
          className="block text-sm font-medium"
        >
          Descrição
        </label>
        <textarea
          id={`${id}-descricao`}
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          rows={3}
          aria-invalid={erros.descricao ? "true" : "false"}
          aria-describedby={
            erros.descricao ? `${id}-descricao-erro` : undefined
          }
          className="w-full rounded border border-slate-300 p-2 aria-[invalid=true]:border-red-600"
        />
        {erros.descricao && (
          <p
            id={`${id}-descricao-erro`}
            role="alert"
            className="text-sm text-red-700"
          >
            {erros.descricao}
          </p>
        )}
      </div>

      {erroApi && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"
        >
          {erroApi}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? "Salvando..." : rotuloBotao}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="rounded border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
