import { useState } from "react";
import { TarefaForm } from "./components/TarefaForm";
import { TarefaList } from "./components/TarefaList";

export default function App() {
  // O estado fica no App porque o formulário e a lista precisam das mesmas tarefas
  const [tarefas, setTarefas] = useState([]);

  // Na Prática 7 essa função passa a chamar a API (POST /tarefas) em vez de guardar em memória
  function adicionarTarefa({ titulo, descricao }) {
    setTarefas((atuais) => [
      ...atuais,
      { id: crypto.randomUUID(), titulo, descricao },
    ]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Gerenciador de Tarefas</h1>
      <TarefaForm onAdicionar={adicionarTarefa} />
      <section aria-labelledby="tarefas-titulo" className="space-y-3">
        <h2 id="tarefas-titulo" className="text-xl font-semibold">
          Tarefas cadastradas
        </h2>
        <TarefaList tarefas={tarefas} />
      </section>
    </main>
  );
}
