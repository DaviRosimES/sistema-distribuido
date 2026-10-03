import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    # Cliente de teste do FastAPI, assim não preciso subir o servidor com o uvicorn
    return TestClient(app)
