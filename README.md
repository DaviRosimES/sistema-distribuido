# Comparador de Autocustódia

Projeto Final de C216 — Sistemas Distribuídos (Inatel, 2026.2).

**Vídeo de demonstração:** _(link a ser adicionado)_

## Objetivo e tema

Quem compra bitcoin pra guardar na própria carteira (autocustódia) paga três custos na
corretora: a **taxa de negociação**, o **spread** (diferença entre o preço cobrado e o de
mercado) e a **taxa de saque**, que é um valor fixo em satoshis. Como a taxa de saque é fixa,
uma corretora com taxas percentuais baixas pode sair mais cara que outra pra compras pequenas,
e juntar várias compras num saque só muda completamente a conta.

O sistema guarda as taxas de cada corretora e, dado um valor de compra, calcula quanto chega
de fato na carteira em cada uma, ordena da mais barata pra mais cara e salva a simulação num
histórico.

## Funcionalidades

- **Corretoras (CRUD completo):** cadastrar, listar, editar (PUT), ativar/desativar (PATCH) e
  remover. Cada corretora tem taxa de negociação (%), spread (%), taxa de saque on-chain e
  Lightning (sats), saque mínimo e observações.
- **Simulações (CRUD):** informar valor por compra, preço do BTC, rede do saque (on-chain ou
  Lightning), quantas compras são juntadas por saque e o custo máximo aceitável. A API calcula
  o ranking e salva a simulação; dá pra editar a descrição, recalcular com as taxas atuais e
  remover.
- **Regras de negócio** (no backend, em `app/services/`):
  - custo total = taxa de negociação + spread + taxa de saque convertida em reais;
  - a corretora credita sats inteiros (arredonda pra baixo);
  - corretora **inviável** quando a compra não atinge o saque mínimo, quando a taxa de saque
    é maior que o valor comprado ou quando ela não saca pela Lightning; inviáveis vão pro fim
    do ranking com o motivo;
  - **valor mínimo** por compra pra que o custo fique no alvo (ex.: 1%), ou "impossível"
    quando só as taxas percentuais já passam do alvo;
  - **economia de juntar saques**: comparação com sacar a cada compra;
  - corretora que saca pela Lightning precisa ter a taxa Lightning informada (422);
  - nome de corretora único sem diferenciar maiúsculas (409);
  - corretoras inativas ficam fora das simulações;
  - o ranking salvo é uma "foto": mudar as taxas de uma corretora (ou apagá-la) não altera
    simulações antigas, só um recálculo explícito.
- **Interface:** estados de carregamento, sucesso e erro, validação dos formulários com as
  mesmas regras do backend, aceita números no formato brasileiro (`1.000,50`) e funciona no
  celular.

### Exemplo de cálculo

R$ 1.000 com o BTC a R$ 500.000, numa corretora com 0,5% de taxa, 1% de spread e 20.000 sats
de saque on-chain:

| Etapa                                    | Valor         |
| ---------------------------------------- | ------------- |
| Taxa de negociação (0,5%)                | R$ 5,00       |
| Spread (1%)                              | R$ 10,00      |
| Sobra R$ 985 → sats comprados            | 197.000 sats  |
| Taxa de saque (20.000 sats)              | R$ 100,00     |
| **Chega na carteira**                    | 177.000 sats  |
| **Custo total**                          | R$ 115 (11,5%) |

Juntando 4 compras por saque, o custo cai pra R$ 160 nos R$ 4.000 (4%), uma economia de
R$ 300. Esse é o caso testado em `backend/tests/unit/test_calculadora.py`.

## Tecnologias

| Parte      | Stack                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| Backend    | Python 3.11, FastAPI, Pydantic, SQLAlchemy 2, Alembic, Poetry, Ruff      |
| Banco      | PostgreSQL 16                                                            |
| Frontend   | React 19, Vite, Tailwind CSS, Biome                                      |
| Testes     | Pytest, Vitest + Testing Library, Playwright (E2E)                       |
| Infra      | Docker, Docker Compose, Makefile, GitHub Actions                         |

## Arquitetura

```
Navegador (React, :5173) --fetch/JSON--> API FastAPI (:8000) --SQLAlchemy--> PostgreSQL (:5432)
```

O backend mantém as camadas trabalhadas nas aulas:

```
backend/
├── app/
│   ├── main.py                 # cria a aplicação, configura o CORS e registra os routers
│   ├── seed.py                 # corretoras de exemplo (make seed / make docker-seed)
│   ├── api/
│   │   ├── dependencies.py     # injeção de dependência (sessão, repositórios e services)
│   │   └── routes/             # endpoints HTTP: health, corretoras e simulacoes
│   ├── core/config.py          # DATABASE_URL e CORS_ORIGINS
│   ├── database/               # engine, sessão e base declarativa
│   ├── models/                 # tabelas: corretoras e simulacoes
│   ├── schemas/                # o que entra e sai da API (validação com Pydantic)
│   ├── services/
│   │   ├── calculadora.py      # regras de cálculo (funções puras, sem banco)
│   │   ├── corretora_service.py
│   │   └── simulacao_service.py
│   └── repositories/           # acesso ao banco com SQLAlchemy
├── alembic/versions/           # migrations versionadas
└── tests/
    ├── unit/                   # schemas, calculadora e services (repositório em memória)
    └── integration/            # endpoints, persistência e CORS com banco
```

```
frontend/
├── src/
│   ├── App.jsx                 # abas Simular e Corretoras, carrega os dados da API
│   ├── components/             # formulários, lista de corretoras, ranking e histórico
│   ├── services/               # chamadas HTTP (api.js, corretoras.js, simulacoes.js)
│   ├── validation.js           # mesmas regras dos schemas do backend
│   └── format.js               # formatação pt-BR (R$, sats, %)
└── tests/
    ├── unit/                   # componentes, validação e serviços
    ├── integration/            # App inteiro com uma API falsa
    └── e2e/                    # Playwright contra a stack completa
```

Mais detalhes do frontend em [`frontend/README.md`](frontend/README.md).

## Endpoints

| Método | Rota                | Descrição                                                    |
| ------ | ------------------- | ------------------------------------------------------------ |
| GET    | `/`                 | Health check                                                 |
| GET    | `/corretoras`       | Lista as corretoras por nome (query opcional `ativa`)        |
| GET    | `/corretoras/{id}`  | Busca uma corretora                                          |
| POST   | `/corretoras`       | Cadastra (409 se o nome já existe, 422 se inválida)          |
| PUT    | `/corretoras/{id}`  | Substitui a corretora inteira                                |
| PATCH  | `/corretoras/{id}`  | Atualiza só os campos enviados                               |
| DELETE | `/corretoras/{id}`  | Remove                                                       |
| GET    | `/simulacoes`       | Lista as simulações, mais recentes primeiro                  |
| GET    | `/simulacoes/{id}`  | Busca uma simulação com o ranking salvo                      |
| POST   | `/simulacoes`       | Calcula o ranking e salva (422 sem corretora ativa)          |
| PATCH  | `/simulacoes/{id}`  | Muda a descrição; mudando parâmetro, recalcula o ranking     |
| DELETE | `/simulacoes/{id}`  | Remove                                                       |

Com a API no ar, a documentação interativa (Swagger) fica em `http://localhost:8000/docs`.

## Pré-requisitos

- Docker com o Docker Compose (pra rodar tudo junto)
- Para desenvolver fora do Docker: Python 3.11+, Poetry 2, Node.js 22+ e `make`

## Variáveis de ambiente

Copie o `.env.example` para `.env` se quiser mudar algum valor; os padrões já funcionam.

| Variável            | Padrão                                    | Uso                                       |
| ------------------- | ----------------------------------------- | ----------------------------------------- |
| `POSTGRES_USER`     | `postgres`                                | Usuário do banco                          |
| `POSTGRES_PASSWORD` | `postgres`                                | Senha do banco (troque fora do ambiente local) |
| `POSTGRES_DB`       | `sistema_distribuido`                     | Nome do banco                             |
| `POSTGRES_PORT`     | `5432`                                    | Porta do Postgres no host                 |
| `BACKEND_PORT`      | `8000`                                    | Porta da API no host                      |
| `FRONTEND_PORT`     | `5173`                                    | Porta do frontend no host                 |
| `CORS_ORIGINS`      | `http://localhost:5173,http://127.0.0.1:5173` | Origens que podem chamar a API        |
| `VITE_API_URL`      | `http://localhost:8000`                   | Endereço da API usado pelo navegador      |
| `DATABASE_URL`      | montada pelo compose                      | Conexão do backend com o banco            |

O `.env` está no `.gitignore`; nenhum segredo real é versionado.

## Rodando com Docker Compose

```bash
cp .env.example .env    # opcional
make docker-up          # sobe db, migrations, API e frontend
make docker-seed        # opcional: cadastra 4 corretoras de exemplo
```

Acesse:

- Aplicação: <http://localhost:5173>
- API e Swagger: <http://localhost:8000/docs>

O compose sobe os serviços nesta ordem, cada um esperando o anterior ficar saudável:

- `db`: PostgreSQL 16, com os dados no volume `db-data`;
- `migrate`: roda `alembic upgrade head` e termina;
- `backend`: a API;
- `frontend`: o Vite servindo o React.

`make docker-ps` mostra o status (todos `healthy`, e o `migrate` como `Exited (0)`).
`make docker-logs` acompanha os logs e `make docker-down` derruba tudo (os dados continuam
no volume).

> As corretoras do seed são **fictícias**, com taxas inventadas só pra mostrar perfis
> diferentes. Pra uma comparação real, cadastre as taxas que cada corretora divulga hoje.

Para conferir os dados direto no banco:

```bash
docker compose exec db psql -U postgres -d sistema_distribuido -c "SELECT nome, spread_pct, ativa FROM corretoras;"
```

### Endereços: localhost x nome do serviço

| Quem chama          | Endereço da API / banco                  |
| ------------------- | ---------------------------------------- |
| Navegador (o React) | `http://localhost:8000` (`VITE_API_URL`) |
| Container `backend` | `db:5432` (`DATABASE_URL`)               |

O React roda no navegador, não no container, por isso o `VITE_API_URL` aponta pra porta
publicada no host e não pra `http://backend:8000`.

### CORS

Frontend (`:5173`) e API (`:8000`) são origens diferentes, então a API libera só as origens
de `CORS_ORIGINS` (nunca `*`) e só os métodos usados: `GET`, `POST`, `PUT`, `PATCH` e
`DELETE`, com o cabeçalho `Content-Type`.

## Rodando fora do Docker

```bash
make install
docker compose up -d db   # só o banco
make db-upgrade           # aplica as migrations
make seed                 # opcional: corretoras de exemplo
make run                  # API em http://localhost:8000
make frontend-install
make frontend-dev         # frontend em http://localhost:5173
```

## Migrations

```bash
make db-upgrade                          # aplica as migrations pendentes
make db-downgrade                        # desfaz a última migration
make db-current                          # mostra a migration atual do banco
make db-history                          # lista o histórico
make db-migration msg="descricao"        # gera uma migration a partir dos modelos
```

O histórico começa nas migrations do laboratório de tarefas das aulas, que foi o ponto de
partida técnico. Depois vêm `cria tabela de corretoras`, `cria tabela de simulacoes` e
`remove tabela de tarefas do laboratorio`.

## Testes e lint

```bash
make check-all          # roda tudo abaixo de uma vez (precisa do Docker)

make lint               # backend: ruff check + formatação
make test               # backend: todos os testes
make test-unit          # backend: unitários (schemas, calculadora, services)
make test-integration   # backend: endpoints e persistência
make frontend-check     # frontend: lint + formatação com o Biome
make frontend-test      # frontend: Vitest (unitários + integração)
make frontend-build     # frontend: build do Vite
make e2e                # E2E full-stack com Playwright numa stack isolada
```

Os testes de integração do backend usam SQLite em memória por padrão (o `make test` roda sem
Postgres). Para rodar contra um Postgres, use um banco **só para testes**, porque as tabelas
são apagadas no final:

```bash
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido_test make test
```

O `make e2e` sobe uma stack separada (projeto `sistema-distribuido-e2e`, API na 8001, frontend
na 5174 e volume próprio), roda o Playwright e derruba tudo com `down -v`. O E2E cadastra,
edita, desativa e remove corretoras, cria uma simulação e confere o custo calculado pela API,
e recarrega a página em cada etapa pra provar que os dados vieram do PostgreSQL. Antes do
primeiro E2E, instale o Chromium: `cd frontend && npx playwright install --with-deps chromium`.

## CI

- `.github/workflows/ci-backend.yml` (todo `push` e `pull_request`): Ruff, validação das
  migrations num PostgreSQL (`upgrade head`, `alembic check`, `downgrade base`, `upgrade
  head`) e testes unitários e de integração contra esse PostgreSQL.
- `.github/workflows/ci-frontend.yml` (mudanças no frontend, backend, compose ou Makefile):
  Biome, Vitest, build e `make e2e` com a stack completa no Docker Compose.
