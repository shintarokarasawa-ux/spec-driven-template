# 要求内容

## 概要

SnowflakeのCortex Agents/CoWorkを用いた多層(マスター+サブ)エージェント構造の
バックエンドを、テンプレートのフレームワークとして整備する。
Snowflakeアカウントなしで整備するため、SQL/Python雛形の静的検証+スキル化が中心。

## 背景

ユーザーはSnowflake(CoWork・Cortex AI)でのバックエンド開発を予定している。
2026 Summit時点の公式パターン(マスターエージェント+サブエージェント、UDF経由の
Run API呼び出し、マクロ制御はTasks/SP側)を、再利用可能な雛形と規約に焼き込む。

## 実装対象の機能

### 1. `snowflake/` — Snowflakeサイドの SQL 資産(番号順にデプロイ)
- setup: ロール/DB/スキーマ/WH、PAT用Network Rule・Secret・External Access Integration
- sample: サンプルデータ、セマンティックビュー(Cortex Analyst用)、Cortex Searchサービス
- agents: サブエージェント2種(analyst/search)のCREATE AGENT、サブ呼び出しPython UDF、
  マスターエージェント(genericツールでUDF参照)

### 2. `backend/` — FastAPI BFF(自己完結uvプロジェクト)
- Cortex Agents Run APIクライアント(PAT認証、非ストリーミング+SSEストリーミング)
- `/api/agent/messages`: マスターエージェントへのプロキシ
- `/api/tasks`: フロントエンドのMSW契約と同一のAPI実装(契約の実装例)
- ユニットテスト(httpx.MockTransport、実アカウント不要)

### 3. `snowflake-agents` スキル
- 多層構造の設計規約、CREATE AGENT/Run APIのリファレンス、アカウント側セットアップ手順書
  (PAT発行・CoWork UI確認を含む)、レビュー観点

### 4. テンプレート統合
- devcontainer(backend uv sync、Snowflake CLI)、CLAUDE.md、README、settings.json

## 受け入れ条件

- [ ] backend/: `uv sync --dev` `uv run pytest` `uv run ruff check .` `uv run mypy .` が成功
- [ ] /api/tasks がフロントエンドのMSWハンドラと同一契約(VITE_API_MOCK=false + backend起動で
  フロントが実APIで動く構成)
- [ ] snowflake/のSQLが公式ドキュメントの構文(CREATE AGENT spec・Run API)に準拠し、
  プレースホルダと実行順が明記されている
- [ ] スキルに「アカウントなしでは検証できない箇所」が明示されている

## スコープ外

- 実Snowflakeアカウントでの疎通検証(利用時にスキルの手順で実施)
- ストリーミング応答のフロントエンド表示(BFFはSSE中継の雛形まで)
- CoWork UI操作の自動化(手順書のみ)

## 参照ドキュメント

- Cortex Agents / CREATE AGENT / Run API 公式ドキュメント(2026-07時点)
- `.steering/20260708-api-connection-example/` - フロントエンドのAPI契約
