# backend — Cortex Agents BFF

Snowflake Cortex AgentsのマスターエージェントをフロントエンドからHTTPで使うための
BFF(Backend for Frontend)です。設計規約は `.claude/skills/snowflake-agents/` を参照。

## エンドポイント

- `GET/POST /api/tasks` — フロントエンドのMSWハンドラと同一契約のサンプル実装(インメモリ)
- `POST /api/agent/messages` — `{"message": "...", "thread_id": null}` を受け、
  Cortex Agents Run API(非ストリーミング)の最終応答テキストを返す

## 使い方

```bash
uv sync --dev
cp .env.example .env   # SNOWFLAKE_ACCOUNT_URL / SNOWFLAKE_PAT を設定
uv run uvicorn backend.main:app --reload --port 8000
```

フロントエンドから接続する場合は `frontend/.env.local` に:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_MOCK=false
```

## 検証

```bash
uv run pytest          # ユニットテスト(実Snowflake不要・HTTPは全てモック)
uv run ruff check .
uv run mypy .
```
