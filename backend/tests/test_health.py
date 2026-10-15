from app.main import app
from fastapi.testclient import TestClient


def test_health() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "feedme-backend"}


def test_readiness_reports_mongodb_unavailable_without_startup() -> None:
    response = TestClient(app).get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "service": "mongodb"}

