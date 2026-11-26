import { Bitcoin } from "lucide-react";
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

const tituloSecao = "text-base font-semibold tracking-tight";

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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Carregando dados...
        </p>
      );
    }
    if (erroCarga) {
      return <Aviso>{erroCarga}</Aviso>;
    }
    if (aba === "corretoras") {
      return (
        <div className="space-y-10">
          <section aria-labelledby="nova-corretora" className="space-y-3">
            <h2 id="nova-corretora" className={tituloSecao}>
              Nova corretora
            </h2>
            <CorretoraForm onSalvar={cadastrarCorretora} />
          </section>
          <section aria-labelledby="lista-corretoras" className="space-y-3">
            <h2 id="lista-corretoras" className={tituloSecao}>
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
      <div className="space-y-10">
        <section aria-labelledby="nova-simulacao" className="space-y-3">
          <h2 id="nova-simulacao" className={tituloSecao}>
            Quanto custa comprar e sacar pra sua carteira?
          </h2>
          <p className="-mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {ativas === 0
              ? "Nenhuma corretora ativa: cadastre ou ative uma na aba Corretoras."
              : `A comparação considera as ${ativas} corretoras ativas.`}
          </p>
          <SimulacaoForm onSimular={simular} />
        </section>
        <section aria-labelledby="historico" className="space-y-3">
          <h2 id="historico" className={tituloSecao}>
            Histórico de simulações
          </h2>
          {simulacoes.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
    <main className="mx-auto min-h-screen max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-btc text-white"
          >
            <Bitcoin className="size-5" strokeWidth={2.25} />
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Comparador de Autocustódia
            </h1>
            <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Descubra em qual corretora sai mais barato comprar bitcoin e sacar
              pra sua própria carteira.
            </p>
          </div>
        </div>
        <BotaoTema />
      </header>

      <div
        role="tablist"
        aria-label="Seções"
        className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800"
      >
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => trocarAba(id)}
            className="-mb-px border-b-2 border-transparent pb-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 aria-selected:border-btc aria-selected:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:aria-selected:text-zinc-50"
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel">{conteudo()}</div>
    </main>
  );
}
