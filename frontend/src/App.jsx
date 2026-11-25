import { useEffect, useState } from "react";
import { Aviso } from "./components/Aviso";
import { BotaoTema } from "./components/BotaoTema";
import { CorretoraForm } from "./components/CorretoraForm";
import { CorretoraList } from "./components/CorretoraList";
import { SimulacaoForm } from "./components/SimulacaoForm";
import { SimulacaoItem } from "./components/SimulacaoItem";
import {
  atualizarCorretora,
  criarCorretora,
  listarCorretoras,
  removerCorretora,
  substituirCorretora,
} from "./services/corretoras";
import {
  atualizarSimulacao,
  criarSimulacao,
  listarSimulacoes,
  removerSimulacao,
} from "./services/simulacoes";

const ABAS = [
  { id: "simular", rotulo: "Simular" },
  { id: "corretoras", rotulo: "Corretoras" },
];

// Mesma ordem da API (GET /corretoras ordena por nome)
function porNome(a, b) {
  return a.nome.localeCompare(b.nome, "pt-BR");
}

export default function App() {
  const [aba, setAba] = useState("simular");
  // O useState guarda só o estado da tela; quem guarda os dados de verdade é o banco
  const [corretoras, setCorretoras] = useState([]);
  const [simulacoes, setSimulacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [sucesso, setSucesso] = useState("");
  // A simulação recém-criada já abre com o ranking à mostra
  const [ultimaSimulacaoId, setUltimaSimulacaoId] = useState(null);

  // Busca corretoras e simulações quando a tela abre (e a cada F5)
  useEffect(() => {
    let ativo = true;
    Promise.all([listarCorretoras(), listarSimulacoes()])
      .then(([listaCorretoras, listaSimulacoes]) => {
        if (!ativo) return;
        setCorretoras(listaCorretoras);
        setSimulacoes(listaSimulacoes);
      })
      .catch((erro) => {
        if (ativo) setErroCarga(erro.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    // Se o App sair da tela antes da resposta chegar, o resultado é ignorado
    return () => {
      ativo = false;
    };
  }, []);

  function avisar(mensagem) {
    setErroAcao("");
    setSucesso(mensagem);
  }

  function trocarCorretora(atualizada) {
    setCorretoras((atuais) =>
      atuais
        .map((c) => (c.id === atualizada.id ? atualizada : c))
        .sort(porNome),
    );
  }

  // Cadastro e edição: se a API recusar (nome repetido, regra da Lightning...), o erro
  // sobe pro formulário, que mostra a mensagem e mantém o que foi digitado
  async function cadastrarCorretora(valores) {
    const criada = await criarCorretora(valores);
    setCorretoras((atuais) => [...atuais, criada].sort(porNome));
    avisar(`Corretora "${criada.nome}" cadastrada.`);
  }

  // PUT: o formulário de edição manda a corretora inteira
  async function editarCorretora(corretora, valores) {
    const atualizada = await substituirCorretora(corretora.id, valores);
    trocarCorretora(atualizada);
    avisar(`Corretora "${atualizada.nome}" atualizada.`);
  }

  // PATCH: só o campo que mudou
  async function alternarAtiva(corretora) {
    try {
      const atualizada = await atualizarCorretora(corretora.id, {
        ativa: !corretora.ativa,
      });
      trocarCorretora(atualizada);
      avisar(
        `Corretora "${atualizada.nome}" ${atualizada.ativa ? "ativada" : "desativada"}.`,
      );
    } catch (erro) {
      setSucesso("");
      setErroAcao(erro.message);
    }
  }

  async function excluirCorretora(corretora) {
    try {
      await removerCorretora(corretora.id);
      setCorretoras((atuais) => atuais.filter((c) => c.id !== corretora.id));
      avisar(`Corretora "${corretora.nome}" removida.`);
    } catch (erro) {
      setSucesso("");
      setErroAcao(erro.message);
    }
  }

  async function simular(valores) {
    const criada = await criarSimulacao(valores);
    setSimulacoes((atuais) => [criada, ...atuais]);
    setUltimaSimulacaoId(criada.id);
  }

  // Erros de editar/remover simulação aparecem no próprio item, por isso não são tratados aqui
  async function editarSimulacao(simulacao, alteracoes) {
    const atualizada = await atualizarSimulacao(simulacao.id, alteracoes);
    setSimulacoes((atuais) =>
      atuais.map((s) => (s.id === atualizada.id ? atualizada : s)),
    );
  }

  async function excluirSimulacao(simulacao) {
    await removerSimulacao(simulacao.id);
    setSimulacoes((atuais) => atuais.filter((s) => s.id !== simulacao.id));
  }

  function trocarAba(id) {
    setAba(id);
    setSucesso("");
    setErroAcao("");
  }

  function conteudo() {
    if (carregando) {
      return (
        <p className="text-slate-600 dark:text-slate-400">
          Carregando dados...
        </p>
      );
    }
    if (erroCarga) {
      return <Aviso>{erroCarga}</Aviso>;
    }
    if (aba === "corretoras") {
      return (
        <div className="space-y-6">
          <section aria-labelledby="nova-corretora" className="space-y-3">
            <h2 id="nova-corretora" className="text-xl font-semibold">
              Nova corretora
            </h2>
            <CorretoraForm onSalvar={cadastrarCorretora} />
          </section>
          <section aria-labelledby="lista-corretoras" className="space-y-3">
            <h2 id="lista-corretoras" className="text-xl font-semibold">
              Corretoras cadastradas
            </h2>
            <Aviso tipo="sucesso">{sucesso}</Aviso>
            <Aviso>{erroAcao}</Aviso>
            <CorretoraList
              corretoras={corretoras}
              onEditar={editarCorretora}
              onAlternarAtiva={alternarAtiva}
              onRemover={excluirCorretora}
            />
          </section>
        </div>
      );
    }

    const ativas = corretoras.filter((c) => c.ativa).length;
    return (
      <div className="space-y-6">
        <section aria-labelledby="nova-simulacao" className="space-y-3">
          <h2 id="nova-simulacao" className="text-xl font-semibold">
            Quanto custa comprar e sacar pra sua carteira?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {ativas === 0
              ? "Nenhuma corretora ativa: cadastre ou ative uma na aba Corretoras."
              : `A comparação considera as ${ativas} corretoras ativas.`}
          </p>
          <SimulacaoForm onSimular={simular} />
        </section>
        <section aria-labelledby="historico" className="space-y-3">
          <h2 id="historico" className="text-xl font-semibold">
            Histórico de simulações
          </h2>
          {simulacoes.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              Nenhuma simulação salva.
            </p>
          ) : (
            <ul aria-label="Simulações salvas" className="space-y-3">
              {simulacoes.map((simulacao) => (
                <SimulacaoItem
                  key={simulacao.id}
                  simulacao={simulacao}
                  aberta={simulacao.id === ultimaSimulacaoId}
                  onAtualizar={editarSimulacao}
                  onRemover={excluirSimulacao}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Comparador de Autocustódia</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Descubra em qual corretora sai mais barato comprar bitcoin e sacar
            pra sua própria carteira.
          </p>
        </div>
        <BotaoTema />
      </header>

      <div
        role="tablist"
        aria-label="Seções"
        className="flex gap-2 border-b border-slate-200 dark:border-slate-700"
      >
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => trocarAba(id)}
            className="-mb-px border-b-2 border-transparent px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 aria-selected:border-orange-600 aria-selected:text-orange-700 dark:aria-selected:text-orange-400"
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel">{conteudo()}</div>
    </main>
  );
}
