# Frontend

Interface do Comparador de Autocustódia em React + Vite, estilizada com Tailwind CSS. As
corretoras e as simulações vêm da API FastAPI do `backend/` e ficam salvas no PostgreSQL,
então continuam lá depois de recarregar a página.

Requer Node.js 22 ou superior.

## Estrutura

```
frontend/
├── src/
│   ├── components/
│   │   ├── Campo.jsx           # rótulo + input + ajuda/erro (acessível)
│   │   ├── Aviso.jsx           # mensagens de erro (alert) e sucesso (status)
│   │   ├── CorretoraForm.jsx   # cadastro e edição de corretora, com validação
│   │   ├── CorretoraItem.jsx   # uma corretora: editar, ativar/desativar e remover
│   │   ├── CorretoraList.jsx   # listagem e estado vazio
│   │   ├── SimulacaoForm.jsx   # parâmetros da simulação
│   │   ├── RankingTabela.jsx   # resultado: custo por corretora, inviáveis e valor mínimo
│   │   └── SimulacaoItem.jsx   # item do histórico: ver ranking, editar, recalcular, remover
│   ├── services/
│   │   ├── api.js              # request(): fetch + tratamento de erros
│   │   ├── corretoras.js       # chamadas de /corretoras
│   │   └── simulacoes.js       # chamadas de /simulacoes
│   ├── App.jsx                 # abas, carregamento inicial e estado da tela
│   ├── validation.js           # regras de validação (mesmas do backend)
│   ├── format.js               # R$, sats, % e datas em pt-BR
│   ├── index.css               # importa o Tailwind
│   └── main.jsx
├── tests/
│   ├── setup.js                # configuração do Vitest (jest-dom + cleanup)
│   ├── helpers/                # API falsa e dados de exemplo
│   ├── unit/                   # validação, serviços e componentes isolados
│   ├── integration/            # App inteiro com fetch mockado
│   └── e2e/                    # Playwright contra a stack completa
├── Dockerfile
├── biome.json
├── playwright.config.js
└── vite.config.js              # Vite + Tailwind + Vitest
```

## Como rodar

O jeito mais simples é subir tudo pelo Docker Compose, a partir da raiz:

```bash
make docker-up          # db + migrations + API + frontend
```

O frontend fica em `http://localhost:5173` e a API em `http://localhost:8000`.

Para rodar só o frontend fora do Docker (com a API no ar):

```bash
make frontend-install   # npm ci
make frontend-dev       # http://localhost:5173
```

A URL da API vem da variável `VITE_API_URL` (padrão `http://localhost:8000`). Variáveis
`VITE_*` vão parar no código que roda no navegador, então nunca coloque senha nelas.

## Chamadas à API

As chamadas ficam em `src/services/`: uma função por operação de cada recurso
(`listarCorretoras`, `criarCorretora`, `substituirCorretora`, `atualizarCorretora`,
`removerCorretora`, `listarSimulacoes`, `criarSimulacao`, `atualizarSimulacao` e
`removerSimulacao`). Todas passam pela `request` de `api.js`, que trata três casos:

| Situação         | O que acontece                                                     |
| ---------------- | ------------------------------------------------------------------ |
| API inacessível  | o `fetch` rejeita e o erro vira "Não foi possível conectar à API." |
| Resposta 4xx/5xx | usa o `detail` da API (404, 409, 422) ou uma mensagem padrão       |
| Sucesso          | devolve o JSON (ou `null` no 204 do DELETE)                        |

## Testes e qualidade

| Comando (raiz)           | Comando (`frontend/`)                  | O que faz                                          |
| ------------------------ | -------------------------------------- | -------------------------------------------------- |
| `make frontend-lint`     | `npm run lint`                         | Lint com o Biome                                   |
| `make frontend-format`   | `npm run format`                       | Formata o código                                   |
| `make frontend-check`    | `npm run lint && npm run format:check` | Lint + formatação sem alterar arquivos             |
| `make frontend-test`     | `npm run test`                         | Vitest (unitários + integração, com fetch mockado) |
| `make e2e`               |                                        | E2E full-stack numa stack isolada                  |
| `make frontend-test-e2e` | `npm run test:e2e`                     | Playwright contra uma stack que já está no ar      |
| `make frontend-build`    | `npm run build`                        | Build de produção                                  |
| `make check-all`         |                                        | Backend + frontend + E2E                           |

Os testes do Vitest não dependem do backend: o `fetch` é trocado por uma API falsa
(`tests/helpers/api.js`) que responde como a de verdade, inclusive com 404, 409 e 422.

O E2E não usa mock nenhum: o navegador cadastra corretoras e simulações pela tela, tudo passa
pela API e fica no PostgreSQL, e o teste recarrega a página pra provar que os dados continuam
lá. O `make e2e` sobe uma
stack separada (portas 8001 e 5174), roda os testes e derruba tudo no final. Para rodar contra
a stack de desenvolvimento, use `make frontend-test-e2e` com ela no ar (o endereço vem de
`E2E_BASE_URL`, padrão `http://localhost:5173`).

Antes do primeiro E2E, instale o Chromium do Playwright (uma vez por máquina):

```bash
cd frontend
npx playwright install --with-deps chromium
```

O `--with-deps` instala também as bibliotecas do sistema que o navegador precisa (usa `sudo`).

## CI

O workflow `.github/workflows/ci-frontend.yml` roda quando algo em `frontend/`, `backend/`, no
`docker-compose.yml` ou no `Makefile` muda, no `push` e no `pull_request`: `npm ci`, lint,
verificação de formatação, Vitest, build e `make e2e`. Se o E2E falhar, o relatório do
Playwright fica disponível como artefato do run.
