import { useEffect, useState } from "react";
import { TarefaForm } from "./components/TarefaForm";
import { TarefaList } from "./components/TarefaList";
import { criarTarefa, listarTarefas } from "./services/tarefas";

export default function App() {
  // O useState agora guarda só o estado da tela; quem guarda as tarefas de verdade é o banco
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");

  // Busca as tarefas na API quando a tela abre (e a cada F5, por isso elas não somem mais)
  useEffect(() => {
    let ativo = true;
    listarTarefas()
      .then((dados) => {
        if (ativo) setTarefas(dados);
      })
      .catch((erro) => {
        if (ativo) setErroLista(erro.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    // Se o App sair da tela antes da resposta chegar, o resultado é ignorado
    return () => {
      ativo = false;
    };
  }, []);

  // Se a API recusar (título repetido, sem conexão), o erro sobe pro TarefaForm,
  // que mostra a mensagem e mantém o que foi digitado
  async function adicionarTarefa(valores) {
    const criada = await criarTarefa(valores);
    setTarefas((atuais) => [...atuais, criada]);
  }

  function conteudoDaLista() {
    if (carregando) {
      return <p className="text-slate-600">Carregando tarefas...</p>;
    }
    if (erroLista) {
      return (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-red-700"
        >
          {erroLista}
        </p>
      );
    }
    return <TarefaList tarefas={tarefas} />;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Gerenciador de Tarefas</h1>
      <TarefaForm onSalvar={adicionarTarefa} />
      <section aria-labelledby="tarefas-titulo" className="space-y-3">
        <h2 id="tarefas-titulo" className="text-xl font-semibold">
          Tarefas cadastradas
        </h2>
        {conteudoDaLista()}
      </section>
    </main>
  );
}
