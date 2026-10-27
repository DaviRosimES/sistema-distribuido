# Sistema Distribuído

Backend FastAPI gerenciado com Poetry e executado via Docker Compose.

## Estrutura do backend

```
backend/
├── app/
│   ├── main.py              # só cria a aplicação e registra os routers
│   ├── api/
│   │   ├── dependencies.py  # injeção de dependência (repositório e service)
│   │   └── routes/          # endpoints HTTP (health e tarefas)
│   ├── schemas/             # modelos Pydantic
│   ├── services/            # regras de negócio
│   └── repositories/        # acesso aos dados (em memória por enquanto)
└── tests/
    ├── unit/                # testam schemas, repositório e service isolados
    └── integration/         # testam os endpoints via TestClient
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

Com o servidor rodando (`make run`), a documentação interativa fica em `http://localhost:8000/docs`.

## Como executar os testes

Os testes ficam em `backend/tests` e usam o Pytest (dependência de desenvolvimento).

```bash
make install            # instala as dependências (inclui as de desenvolvimento)
make test               # roda todos os testes
make test-unit          # roda só os unitários
make test-integration   # roda só os de integração
```

Ou, sem o Makefile:

```bash
cd backend
poetry install
poetry run pytest -v                     # todos
poetry run pytest -v tests/unit          # unitários
poetry run pytest -v tests/integration   # integração
```

## CI

O workflow `.github/workflows/ci-backend.yml` roda os testes no GitHub Actions
a cada `push` e `pull_request`: configura o Python 3.11, instala as dependências com o Poetry
e executa os testes unitários e os de integração em etapas separadas.
