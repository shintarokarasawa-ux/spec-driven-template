from collections.abc import Callable

import httpx
import pytest

from backend.cortex.client import CortexAgentClient, CortexAgentError

Handler = Callable[[httpx.Request], httpx.Response]


def make_client(handler: Handler) -> CortexAgentClient:
    return CortexAgentClient(
        account_url="https://example.snowflakecomputing.com/",
        pat="dummy-pat",
        database="DB",
        schema="SCH",
        agent_name="MASTER",
        transport=httpx.MockTransport(handler),
    )


def test_run_posts_to_agent_endpoint_with_pat() -> None:
    captured: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers["Authorization"]
        return httpx.Response(
            200,
            json={
                "content": [
                    {"type": "text", "text": "A"},
                    {"type": "tool_use", "tool_use": {}},
                    {"type": "text", "text": "B"},
                ]
            },
        )

    text = make_client(handler).run("質問")

    assert captured["url"] == (
        "https://example.snowflakecomputing.com/api/v2/databases/DB/schemas/SCH/agents/MASTER:run"
    )
    assert captured["auth"] == "Bearer dummy-pat"
    assert text == "A\nB"


def test_run_raises_on_non_200() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text="unauthorized")

    with pytest.raises(CortexAgentError):
        make_client(handler).run("質問")


def test_run_stream_yields_text_deltas() -> None:
    sse_body = "\n".join(
        [
            "event: response.status",
            'data: {"status": "running"}',
            "",
            "event: response.text.delta",
            'data: {"text": "こんに"}',
            "",
            "event: response.text.delta",
            'data: {"text": "ちは"}',
            "",
            "event: response",
            'data: {"content": []}',
            "",
        ]
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=sse_body.encode(),
            headers={"Content-Type": "text/event-stream"},
        )

    chunks = list(make_client(handler).run_stream("質問"))

    assert chunks == ["こんに", "ちは"]
