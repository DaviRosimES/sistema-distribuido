# Sistema Distribuído

Gerenciador de tarefas full-stack: frontend em React (`frontend/`), API em FastAPI com
persistência em PostgreSQL (`backend/`) e tudo rodando junto pelo Docker Compose.

```
Navegador (React, :5173) --fetch--> API FastAPI (:8000) --SQLAlchemy--> PostgreSQL (:5432)
```

O frontend tem o próprio README em [`frontend/README.md`](frontend/README.md).

## Estrutura do backend

```
backend/
├── app/
│   ├── main.py              # só cria a aplicação e registra os routers
│   ├── api/
│   │   ├── dependencies.py  # injeção de dependência (sessão, repositório e service)
│   │   └── routes/          # endpoints HTTP (health e tarefas)
│   ├── core/                # configurações (DATABASE_URL e CORS_ORIGINS)
│   ├── database/            # engine, sessão e base declarativa do SQLAlchemy
│   ├── models/              # modelos ORM (como os dados ficam no banco)
│   ├── schemas/             # modelos Pydantic (o que entra e sai da API)
│   ├── services/            # regras de negócio
│   └── repositories/        # acesso aos dados com SQLAlchemy
├── alembic/
│   └── versions/            # migrations do banco
├── alembic.ini
└── tests/
    ├── unit/                # testam schemas e service isolados (sem banco)
    └── integration/         # testam repositório, endpoints e persistência com banco
```

## Endpoints

| Método | Rota                  | Descrição                                            |
|--------|-----------------------|------------------------------------------------------|
| GET    | `/`                   | Health check                                         |
| GET    | `/tarefas`            | Lista as tarefas (query param opcional `concluida`)  |
| GET    | `/tarefas/{id}`       | Busca uma tarefa pelo id                             |
| POST   | `/tarefas`            | Cria uma tarefa                                      |
| PUT    | `/tarefas/{id}`       | Substitui uma tarefa inteira                         |
| PATCH  | `/tarefas/{id}`       | Atualiza só os campos enviados                       |
| DELETE | `/tarefas/{id}`       | Remove uma tarefa                                    |

O título é único: criar ou renomear uma tarefa com um título que já existe responde
`409` com `{"detail": "Já existe uma tarefa com esse título"}`.

Com o servidor rodando, a documentação interativa fica em `http://localhost:8000/docs`.

## Rodando com Docker Compose

```bash
cp .env.example .env    # opcional, os valores padrão já funcionam
make docker-up
```

O compose sobe os serviços nesta ordem, cada um esperando o anterior ficar saudável:

- `db`: PostgreSQL 16, com os dados no volume `db-data`
- `migrate`: roda `alembic upgrade head` e termina
- `backend`: a API em `http://localhost:8000` (Swagger em `/docs`)
- `frontend`: o React em `http://localhost:5173`

`make docker-ps` mostra o status; todos devem aparecer como `healthy` (o `migrate` aparece
como `Exited (0)`, porque ele só roda as migrations e sai).

### Endereços: localhost x nome do serviço

| Quem chama                | Endereço da API / banco                     |
|---------------------------|---------------------------------------------|
| Navegador (o React)       | `http://localhost:8000` (`VITE_API_URL`)    |
| Container `backend`       | `db:5432` (`DATABASE_URL`)                  |

O código React roda no navegador, não no container, por isso o `VITE_API_URL` aponta pra
porta publicada no host e não pra `http://backend:8000`. Já dentro dos containers, `localhost`
é o próprio container, por isso a API acessa o banco como `db`.

### CORS

O frontend (`:5173`) e a API (`:8000`) são origens diferentes, então o navegador só deixa o
React ler as respostas porque a API libera essa origem. As origens vêm da variável
`CORS_ORIGINS` (separadas por vírgula, padrão `http://localhost:5173,http://127.0.0.1:5173`).
Nunca uso `*`. Na aba Network do navegador dá pra ver o `OPTIONS` antes do `POST` e o
cabeçalho `access-control-allow-origin` na resposta.

Para conferir os dados direto no banco:

```bash
docker compose exec db psql -U postgres -d sistema_distribuido -c "SELECT * FROM tarefas;"
```

## Rodando fora do Docker

A URL do banco vem da variável `DATABASE_URL`. Sem ela, o padrão é
`postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido`, que é o Postgres
do compose exposto na máquina.

```bash
make install
docker compose up -d db   # só o banco
make db-upgrade           # aplica as migrations
make run
```

## Migrations

```bash
make db-upgrade                          # aplica as migrations pendentes
make db-downgrade                        # desfaz a última migration
make db-current                          # mostra a migration atual do banco
make db-history                          # lista o histórico
make db-migration msg="descricao"        # gera uma migration a partir dos modelos
```

Depois de gerar uma migration, revise o arquivo em `backend/alembic/versions` antes de aplicar.

## Testes e lint

```bash
make check-all          # roda tudo abaixo de uma vez (precisa do Docker)

make lint               # backend: ruff check + verificação de formatação
make test               # backend: todos os testes
make test-unit          # backend: só os unitários
make test-integration   # backend: só os de integração
make frontend-check     # frontend: lint + formatação com o Biome
make frontend-test      # frontend: Vitest (unitários + integração)
make frontend-build     # frontend: build do Vite
make e2e                # E2E full-stack com Playwright numa stack isolada
```

O `make e2e` sobe uma stack separada da de desenvolvimento (projeto `sistema-distribuido-e2e`,
API na porta 8001, frontend na 5174 e um volume próprio do Postgres), roda o Playwright contra
ela e no final derruba tudo com `down -v`, mesmo se algum teste falhar. O banco de
desenvolvimento nunca é tocado.

Por padrão os testes de integração usam SQLite em memória, então o `make test` roda sem
precisar do Postgres. Para rodar contra um Postgres, defina `TEST_DATABASE_URL` com um banco
**só para testes**, porque os testes apagam as tabelas no final:

```bash
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido_test make test
```

## CI

São dois workflows. O `.github/workflows/ci-frontend.yml` roda quando muda algo no
frontend, no backend, no compose ou no Makefile: lint e formatação com o Biome, Vitest, build
e o `make e2e`. O `.github/workflows/ci-backend.yml` roda a cada `push` e `pull_request`:

1. configura o Python 3.11 e instala as dependências com o Poetry;
2. roda o lint com o ruff;
3. sobe um PostgreSQL como service e valida as migrations
   (`upgrade head`, `alembic check`, `downgrade base` e `upgrade head` de novo);
4. roda os testes unitários e os de integração, esses contra o PostgreSQL.
