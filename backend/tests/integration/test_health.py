import pytest

from app.main import app


def test_get_raiz_retorna_200(client):
    response = client.get("/")

    assert response.status_code == 200


def test_get_raiz_retorna_corpo_healthy(client):
    response = client.get("/")

    assert response.json() == "Healthy!"


def test_get_raiz_retorna_json(client):
    response = client.get("/")

    assert response.headers["content-type"] == "application/json"


def test_rota_health_check_esta_registrada():
    # Com o include_router o app.routes não expõe mais o path direto, então olho pelo schema OpenAPI
    rotas = app.openapi()["paths"]

    assert "/" in rotas


# Caso de erro: rotas que não existem têm que devolver 404
@pytest.mark.parametrize("rota", ["/nao-existe", "/health", "/api/v1/qualquer-coisa"])
def test_rota_inexistente_retorna_404(client, rota):
    response = client.get(rota)

    assert response.status_code == 404


# Caso de erro: a raiz só aceita GET, os outros métodos devem dar 405
@pytest.mark.parametrize("metodo", ["post", "put", "delete", "patch"])
def test_metodo_nao_permitido_na_raiz_retorna_405(client, metodo):
    response = getattr(client, metodo)("/")

    assert response.status_code == 405
