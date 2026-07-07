from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app
from backend.routers.tasks import reset_tasks


@pytest.fixture
def client() -> Iterator[TestClient]:
    reset_tasks()
    with TestClient(create_app()) as test_client:
        yield test_client


def test_list_tasks_returns_initial_tasks(client: TestClient) -> None:
    response = client.get("/api/tasks")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 3
    assert payload[0] == {"id": "TASK-1", "title": "永続ドキュメントを作成する", "status": "done"}


def test_create_task_appends_open_task(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "APIに接続する"})

    assert response.status_code == 201
    assert response.json() == {"id": "TASK-4", "title": "APIに接続する", "status": "open"}
    assert len(client.get("/api/tasks").json()) == 4


def test_create_task_with_empty_title_is_rejected(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": ""})

    assert response.status_code == 422
