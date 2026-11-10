import pytest

ORIGEM_DO_FRONT = "http://localhost:5173"


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "PATCH", "DELETE"])
def test_preflight_libera_a_origem_do_frontend(client, metodo):
    # O navegador manda esse OPTIONS antes de qualquer requisição com JSON pra outra origem
    response = client.options(
        "/tarefas",
        headers={
            "Origin": ORIGEM_DO_FRONT,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ORIGEM_DO_FRONT
    assert metodo in response.headers["access-control-allow-methods"]


def test_resposta_traz_o_cabecalho_para_a_origem_do_frontend(client):
    response = client.get("/tarefas", headers={"Origin": ORIGEM_DO_FRONT})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ORIGEM_DO_FRONT


def test_origem_desconhecida_nao_e_liberada(client):
    response = client.options(
        "/tarefas",
        headers={
            "Origin": "http://site-qualquer.com",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_requisicao_sem_origin_continua_funcionando(client):
    # curl e outros servidores não mandam Origin, e o CORS não muda nada pra eles
    response = client.get("/tarefas")

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
