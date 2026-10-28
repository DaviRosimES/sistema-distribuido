import { useState } from "react";
import { validarTarefa } from "../validation";

export function TarefaForm({ onAdicionar }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erros, setErros] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarTarefa({ titulo, descricao });
    setErros(resultado.erros);
    if (Object.keys(resultado.erros).length > 0) return;

    onAdicionar(resultado.valores);
    setTitulo("");
    setDescricao("");
  }

  // noValidate desliga a validação nativa do navegador, pra mensagem de erro ser sempre a nossa
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor="tarefa-titulo" className="block text-sm font-medium">
          Título
        </label>
        <input
          id="tarefa-titulo"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          aria-invalid={erros.titulo ? "true" : "false"}
          aria-describedby={erros.titulo ? "tarefa-titulo-erro" : undefined}
          className="w-full rounded border border-slate-300 p-2 aria-[invalid=true]:border-red-600"
        />
        {erros.titulo && (
          <p
            id="tarefa-titulo-erro"
            role="alert"
            className="text-sm text-red-700"
          >
            {erros.titulo}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="tarefa-descricao" className="block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="tarefa-descricao"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          rows={3}
          aria-invalid={erros.descricao ? "true" : "false"}
          aria-describedby={
            erros.descricao ? "tarefa-descricao-erro" : undefined
          }
          className="w-full rounded border border-slate-300 p-2 aria-[invalid=true]:border-red-600"
        />
        {erros.descricao && (
          <p
            id="tarefa-descricao-erro"
            role="alert"
            className="text-sm text-red-700"
          >
            {erros.descricao}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
      >
        Adicionar
      </button>
    </form>
  );
}
