# Frontend

Gerenciador de tarefas em React + Vite, estilizado com Tailwind CSS. Nesta etapa as tarefas
ficam só em memória (somem ao recarregar a página). A integração com a API do backend fica
para a Prática 7.

Requer Node.js 22 ou superior.

## Estrutura

```
frontend/
├── src/
│   ├── components/
│   │   ├── TarefaForm.jsx   # formulário (título + descrição) com validação
│   │   └── TarefaList.jsx   # listagem e estado vazio
│   ├── App.jsx              # guarda o estado das tarefas
│   ├── validation.js        # regras de validação (mesmas do backend)
│   ├── index.css            # importa o Tailwind
│   └── main.jsx
├── tests/
│   ├── setup.js             # configuração do Vitest (jest-dom + cleanup)
│   ├── unit/                # validação e componentes isolados
│   ├── integration/         # App inteiro: formulário + lista
│   └── e2e/                 # Playwright, no navegador
├── biome.json
├── playwright.config.js
└── vite.config.js           # Vite + Tailwind + Vitest
```

## Como rodar

A partir da raiz do repositório:

```bash
make frontend-install   # npm ci
make frontend-dev       # http://localhost:5173
```

Ou dentro de `frontend/`:

```bash
npm ci
npm run dev
```

## Testes e qualidade

| Comando (raiz)           | Comando (`frontend/`)                  | O que faz                              |
| ------------------------ | -------------------------------------- | -------------------------------------- |
| `make frontend-lint`     | `npm run lint`                         | Lint com o Biome                       |
| `make frontend-format`   | `npm run format`                       | Formata o código                       |
| `make frontend-check`    | `npm run lint && npm run format:check` | Lint + formatação sem alterar arquivos |
| `make frontend-test`     | `npm run test`                         | Vitest (unitários + integração)        |
| `make frontend-test-e2e` | `npm run test:e2e`                     | Playwright (E2E)                       |
| `make frontend-build`    | `npm run build`                        | Build de produção                      |
| `make check-all`         |                                        | Backend + frontend inteiros            |

Antes do primeiro E2E, instale o Chromium do Playwright (uma vez por máquina):

```bash
cd frontend
npx playwright install --with-deps chromium
```

O `--with-deps` instala também as bibliotecas do sistema que o navegador precisa (usa `sudo`).
O Playwright sobe o Vite sozinho antes dos testes.

## CI

O workflow `.github/workflows/ci-frontend.yml` roda quando algo em `frontend/` muda, no `push` e
no `pull_request`: `npm ci`, lint, verificação de formatação, Vitest, build e Playwright. Se o
E2E falhar, o relatório do Playwright fica disponível como artefato do run.
