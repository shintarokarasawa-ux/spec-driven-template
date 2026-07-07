---
name: snowflake-agents
description: Snowflake Cortex Agents/CoWorkによる多層エージェントバックエンドの設計規約と実装手順。snowflake/のSQL資産・backend/のBFF実装・エージェント設計・レビュー時に使用する。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Snowflake Agents スキル

Snowflake上に多層(マスター+サブ)エージェント構造を構築し、
`backend/`(FastAPI BFF)経由でフロントエンドから利用するためのスキルです。

## 採用スタック

| 役割 | 採用技術 |
|------|---------|
| エージェント基盤 | Snowflake Cortex Agents(`CREATE AGENT`) |
| エージェントUI | Snowflake CoWork(マスターエージェントを開いて利用) |
| 構造化データQA | Cortex Analyst(セマンティックビュー) |
| 非構造化検索 | Cortex Search |
| 多層ブリッジ | Python UDF + Run API(External Access Integration) |
| BFF | FastAPI(`backend/`、PAT認証でRun API呼び出し) |
| 認証 | PAT(Programmatic Access Token) |

## リポジトリ内の資産

- `snowflake/` — 番号順に実行するSQL(00基盤 → 01外部アクセス → 10-12サンプル → 20-22エージェント)
- `backend/` — Run APIクライアントと`/api/agent/messages`・`/api/tasks`のBFF
- 参照実装: `snowflake/agents/`(2サブ+1マスター)、`backend/src/backend/cortex/client.py`

## クイックリファレンス

### 設計規約とDDL/Run APIリファレンス
多層構造の設計原則・CREATE AGENT仕様・Run API仕様: ./architecture.md

### アカウント側セットアップ手順
PAT発行 → SQL実行順 → CoWork確認 → BFF接続: ./setup.md

## 使用シーン別ガイド

### 新しいサブエージェントを追加する時
1. ./architecture.md の「サブエージェントの分割基準」を確認
2. `snowflake/agents/20_sub_agents.sql` のパターンでCREATE AGENT
3. `21_agent_udfs.sql` に型付きラッパーUDF(`ASK_XXX`)を追加
4. `22_master_agent.sql` のtools/tool_resourcesとorchestration指示に登録

### BFFにエンドポイントを追加する時
- `backend/src/backend/routers/` に追加し、Cortex呼び出しは必ず`CortexAgentClient`経由
- テストは`httpx.MockTransport`注入でHTTPを完全モック(実アカウント不要)

### レビュー時
- ./architecture.md の「レビュー観点」を参照

## 検証コマンド

```bash
# backend(実Snowflake不要)
cd backend && uv run pytest && uv run ruff check . && uv run mypy .

# snowflake/(実アカウントが必要 — setup.mdの手順で疎通確認)
snow sql -f snowflake/setup/00_infra.sql   # 例: Snowflake CLI
```

⚠️ **このテンプレートのSQL資産は実アカウントでの実行検証を行っていない**(2026-07時点の
公式ドキュメント構文に準拠)。初回デプロイ時はsetup.mdの手順で1ファイルずつ確認すること。

## チェックリスト(実装完了前)

- [ ] サブエージェントは1ドメイン1責務で、マスターにパイプライン制御を持たせていない
- [ ] UDFブリッジは失敗時にエラー文字列を返す(全体を止めない)
- [ ] PAT・シークレットがSQL/コード/フロントエンドに残っていない
- [ ] Network Ruleが自アカウントのホストに限定されている
- [ ] backendのテスト・lint・型チェックがパスする
