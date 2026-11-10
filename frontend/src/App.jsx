import { useEffect, useState } from "react";
import { TarefaForm } from "./components/TarefaForm";
import { TarefaList } from "./components/TarefaList";
import {
  atualizarTarefa,
  criarTarefa,
  listarTarefas,
  removerTarefa,
  substituirTarefa,
} from "./services/tarefas";

export default function App() {
  // O useState agora guarda só o estado da tela; quem guarda as tarefas de verdade é o banco
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [erroAcao, setErroAcao] = useState("");

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

  function trocarNaLista(atualizada) {
    setTarefas((atuais) =>
      atuais.map((tarefa) =>
        tarefa.id === atualizada.id ? atualizada : tarefa,
      ),
    );
  }

  // PATCH: só o campo que mudou
  async function alternarConcluida(tarefa) {
    setErroAcao("");
    try {
      trocarNaLista(
        await atualizarTarefa(tarefa.id, { concluida: !tarefa.concluida }),
      );
    } catch (erro) {
      setErroAcao(erro.message);
    }
  }

  // PUT: troca a tarefa inteira, então o concluida vai junto pra não voltar pro padrão.
  // O erro não é tratado aqui porque quem mostra é o formulário de edição.
  async function editarTarefa(tarefa, valores) {
    trocarNaLista(
      await substituirTarefa(tarefa.id, {
        ...valores,
        concluida: tarefa.concluida,
      }),
    );
  }

  async function excluirTarefa(tarefa) {
    setErroAcao("");
    try {
      await removerTarefa(tarefa.id);
      setTarefas((atuais) => atuais.filter((atual) => atual.id !== tarefa.id));
    } catch (erro) {
      setErroAcao(erro.message);
    }
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
    return (
      <>
        {erroAcao && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {erroAcao}
          </p>
        )}
        <TarefaList
          tarefas={tarefas}
          onAlternarConcluida={alternarConcluida}
          onEditar={editarTarefa}
          onRemover={excluirTarefa}
        />
      </>
    );
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
