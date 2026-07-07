import json
from collections.abc import Iterator
from typing import Any

import httpx


class CortexAgentError(Exception):
    """Run APIの呼び出し失敗(非2xx応答)。"""


class CortexAgentClient:
    """Cortex Agents Run APIのクライアント。

    同期httpxを使用する(FastAPIのsyncエンドポイントはスレッドプールで実行される)。
    高並列が必要になったらAsyncClientへの置き換えを検討する。
    transportはテスト用に注入可能(httpx.MockTransport)。
    """

    def __init__(
        self,
        account_url: str,
        pat: str,
        database: str,
        schema: str,
        agent_name: str,
        transport: httpx.BaseTransport | None = None,
        timeout_seconds: float = 300.0,
    ) -> None:
        self._base_url = account_url.rstrip("/")
        self._pat = pat
        self._path = f"/api/v2/databases/{database}/schemas/{schema}/agents/{agent_name}:run"
        self._transport = transport
        self._timeout = timeout_seconds

    def run(self, message: str, thread_id: int | None = None) -> str:
        """非ストリーミングで実行し、最終応答のテキスト部分を結合して返す。"""
        with self._client() as client:
            response = client.post(
                self._path,
                headers=self._headers(accept="application/json"),
                json=self._payload(message, thread_id, stream=False),
            )
        if response.status_code != 200:
            raise CortexAgentError(
                f"Run APIが{response.status_code}を返しました: {response.text[:200]}"
            )
        return _extract_text(response.json())

    def run_stream(self, message: str, thread_id: int | None = None) -> Iterator[str]:
        """SSEストリーミングで実行し、response.text.deltaのテキスト断片をyieldする。"""
        with (
            self._client() as client,
            client.stream(
                "POST",
                self._path,
                headers=self._headers(accept="text/event-stream"),
                json=self._payload(message, thread_id, stream=True),
            ) as response,
        ):
            if response.status_code != 200:
                raise CortexAgentError(f"Run APIが{response.status_code}を返しました")
            event_name = ""
            for line in response.iter_lines():
                if line.startswith("event:"):
                    event_name = line.removeprefix("event:").strip()
                elif line.startswith("data:") and event_name == "response.text.delta":
                    data = json.loads(line.removeprefix("data:").strip())
                    if isinstance(data, dict):
                        yield str(data.get("text", ""))

    def _client(self) -> httpx.Client:
        return httpx.Client(
            base_url=self._base_url, transport=self._transport, timeout=self._timeout
        )

    def _headers(self, accept: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._pat}",
            "Content-Type": "application/json",
            "Accept": accept,
        }

    @staticmethod
    def _payload(message: str, thread_id: int | None, stream: bool) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "messages": [{"role": "user", "content": [{"type": "text", "text": message}]}],
            "stream": stream,
        }
        if thread_id is not None:
            payload["thread_id"] = thread_id
        return payload


def _extract_text(body: Any) -> str:
    """最終`response`オブジェクトからtype==textのcontentを結合する。"""
    if not isinstance(body, dict):
        return ""
    content = body.get("content", [])
    if not isinstance(content, list):
        return ""
    texts = [
        str(item.get("text", ""))
        for item in content
        if isinstance(item, dict) and item.get("type") == "text"
    ]
    return "\n".join(texts)
