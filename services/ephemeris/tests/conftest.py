import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_birth_data():
    return {
        "datetime": "1990-06-15T05:30:00Z",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "bodies": ["sun", "moon", "mars"],
    }
