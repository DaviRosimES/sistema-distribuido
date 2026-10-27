# Sistema Distribuído

Backend FastAPI gerenciado com Poetry, com persistência em PostgreSQL (SQLAlchemy + Alembic)
e executado via Docker Compose.

## Estrutura do backend

```
backend/
├── app/
│   ├── main.py              # só cria a aplicação e registra os routers
│   ├── api/
│   │   ├── dependencies.py  # injeção de dependência (sessão, repositório e service)
│   │   └── routes/          # endpoints HTTP (health e tarefas)
│   ├── core/                # configurações (DATABASE_URL)
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

Com o servidor rodando, a documentação interativa fica em `http://localhost:8000/docs`.

## Rodando com Docker Compose

```bash
cp .env.example .env    # opcional, os valores padrão já funcionam
make docker-up
```

O compose sobe três serviços:

- `db`: PostgreSQL 16, com os dados no volume `db-data`
- `migrate`: roda `alembic upgrade head` e termina
- `backend`: a API, que só sobe depois que as migrations terminam com sucesso

Dentro do compose a API acessa o banco pelo nome do serviço (`db:5432`), não por `localhost`.

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
make test               # roda todos os testes
make test-unit          # roda só os unitários
make test-integration   # roda só os de integração
make lint               # ruff check + verificação de formatação
make format             # formata o código com o ruff
```

Por padrão os testes de integração usam SQLite em memória, então o `make test` roda sem
precisar do Postgres. Para rodar contra um Postgres, defina `TEST_DATABASE_URL` com um banco
**só para testes**, porque os testes apagam as tabelas no final:

```bash
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/sistema_distribuido_test make test
```

## CI

O workflow `.github/workflows/ci-backend.yml` roda a cada `push` e `pull_request`:

1. configura o Python 3.11 e instala as dependências com o Poetry;
2. roda o lint com o ruff;
3. sobe um PostgreSQL como service e valida as migrations
   (`upgrade head`, `alembic check`, `downgrade base` e `upgrade head` de novo);
4. roda os testes unitários e os de integração, esses contra o PostgreSQL.
