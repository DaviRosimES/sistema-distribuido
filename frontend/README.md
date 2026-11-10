# Frontend

Gerenciador de tarefas em React + Vite, estilizado com Tailwind CSS. As tarefas vêm da API
FastAPI do `backend/` e ficam salvas no PostgreSQL, então continuam lá depois de recarregar a
página.

Requer Node.js 22 ou superior.

## Estrutura

```
frontend/
├── src/
│   ├── components/
│   │   ├── TarefaForm.jsx   # formulário de cadastro e de edição, com validação
│   │   ├── TarefaItem.jsx   # uma tarefa: concluir, editar e remover
│   │   └── TarefaList.jsx   # listagem e estado vazio
│   ├── services/
│   │   └── tarefas.js       # todas as chamadas HTTP da API de tarefas
│   ├── App.jsx              # carrega a lista e liga os componentes à API
│   ├── validation.js        # regras de validação (mesmas do backend)
│   ├── index.css            # importa o Tailwind
│   └── main.jsx
├── tests/
│   ├── setup.js             # configuração do Vitest (jest-dom + cleanup)
│   ├── helpers/api.js       # API falsa que responde ao fetch mockado
│   ├── unit/                # validação, serviço e componentes isolados
│   ├── integration/         # App inteiro com fetch mockado
│   └── e2e/                 # Playwright contra a stack completa
├── Dockerfile
├── biome.json
├── playwright.config.js
└── vite.config.js           # Vite + Tailwind + Vitest
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

Todas as chamadas ficam em `src/services/tarefas.js`, que tem uma função pra cada método da
API (`listarTarefas`, `buscarTarefa`, `criarTarefa`, `substituirTarefa`, `atualizarTarefa` e
`removerTarefa`). Elas passam pela função `request`, que trata três casos:

| Situação         | O que acontece                                                     |
| ---------------- | ------------------------------------------------------------------ |
| API inacessível  | o `fetch` rejeita e o erro vira "Não foi possível conectar à API." |
| Resposta 4xx/5xx | usa o `detail` da API (404, 409) ou uma mensagem padrão            |
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
(`tests/helpers/api.js`) que responde como a de verdade, inclusive com 404 e 409.

O E2E não usa mock nenhum: o navegador cadastra pela tela, a tarefa passa pela API e fica no
PostgreSQL, e o teste recarrega a página pra provar que ela continua lá. O `make e2e` sobe uma
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
