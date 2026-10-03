from app.api.routes.health import health_check


def test_health_check_retorna_healthy():
    # Chamo a função direto, sem passar pelo HTTP
    assert health_check() == "Healthy!"
