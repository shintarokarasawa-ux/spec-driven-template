from collections.abc import Callable

import httpx
from fastapi.testclient import TestClient

from backend.cortex.client import CortexAgentClient
from backend.main import create_app
from backend.routers.agent import get_client

Handler = Callable[[httpx.Request], httpx.Response]


def build_test_client(handler: Handler) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_client] = lambda: CortexAgentClient(
        account_url="https://example.snowflakecomputing.com",
        pat="dummy-pat",
        database="AGENT_DEMO_DB",
        schema="AGENTS",
        agent_name="MASTER_AGENT",
        transport=httpx.MockTransport(handler),
    )
    return TestClient(app)


def test_post_message_returns_agent_text() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"role": "assistant", "content": [{"type": "text", "text": "回答です"}]},
        )

    client = build_test_client(handler)

    response = client.post("/api/agent/messages", json={"message": "先月の売上は？"})

    assert response.status_code == 200
    assert response.json() == {"text": "回答です"}


def test_post_message_maps_upstream_error_to_502() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="internal error")

    response = build_test_client(handler).post("/api/agent/messages", json={"message": "q"})

    assert response.status_code == 502


def test_post_message_without_account_url_returns_503() -> None:
    # 依存を上書きしない=既定Settings(SNOWFLAKE_ACCOUNT_URLが空)のまま
    response = TestClient(create_app()).post("/api/agent/messages", json={"message": "q"})

    assert response.status_code == 503
