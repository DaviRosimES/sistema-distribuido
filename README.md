# Sistema Distribuído

Backend FastAPI gerenciado com Poetry e executado via Docker Compose.

## Como executar os testes

Os testes ficam em `backend/tests` e usam o Pytest (dependência de desenvolvimento).

```bash
make install   # instala as dependências (inclui as de desenvolvimento)
make test      # roda o Pytest em modo verboso
```

Ou, sem o Makefile:

```bash
cd backend
poetry install
poetry run pytest -v
```

## CI

O workflow `.github/workflows/ci-backend.yml` roda os testes no GitHub Actions
a cada `push` e `pull_request`: configura o Python 3.11, instala as dependências com o Poetry e executa o Pytest.
