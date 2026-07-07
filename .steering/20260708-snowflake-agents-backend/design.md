# 設計書

## アーキテクチャ概要

```
[React frontend] ──/api/*──▶ [backend/ FastAPI BFF] ──Run API(PAT)──▶ [マスターエージェント]
                              ├ /api/tasks(契約実装例)                    │ generic tool(UDF)
                              └ /api/agent/messages                       ▼
                                                          [サブ呼び出しUDF(External Access)]
                                                           ├──▶ サブ: ANALYST_AGENT(Cortex Analyst)
                                                           └──▶ サブ: SEARCH_AGENT(Cortex Search)
```

- マクロなオーケストレーション(バッチ・パイプライン)はTasks/SPで行い、
  エージェントは狭い責務+型付き契約とする(公式ベストプラクティス)
- CoWorkはマスターエージェントのUI面。エージェント実体はCREATE AGENTで管理

## snowflake/ ファイル構成(番号=実行順)

```
snowflake/
├── setup/00_infra.sql          # ロール・DB(AGENT_DEMO_DB)・スキーマ(AGENTS)・WH
├── setup/01_agent_access.sql   # PAT Secret・Network Rule・External Access Integration
├── sample/10_sample_data.sql   # 売上サンプルテーブル+ドキュメントテーブル
├── sample/11_semantic_view.sql # Cortex Analyst用セマンティックビュー
├── sample/12_search_service.sql# Cortex Searchサービス
├── agents/20_sub_agents.sql    # ANALYST_AGENT / SEARCH_AGENT(CREATE AGENT)
├── agents/21_agent_udfs.sql    # ASK_ANALYST/ASK_SEARCH UDF(Run API呼び出し)
└── agents/22_master_agent.sql  # MASTER_AGENT(genericツール=UDF)+ GRANT
```

- 識別子は AGENT_DEMO_DB / AGENTS / AGENT_WH / AGENT_DEV_ROLE に統一し、
  各ファイル冒頭に「プロジェクトに合わせて変更」を明記
- CREATE AGENT specは確認済み構文(orchestration.budget / instructions /
  tools(tool_spec) / tool_resources)に準拠

## backend/ 構成(自己完結uvプロジェクト)

```
backend/
├── pyproject.toml              # fastapi, httpx, pydantic-settings, uvicorn / dev: pytest, ruff, mypy
├── .env.example                # SNOWFLAKE_ACCOUNT_URL, SNOWFLAKE_PAT, DB/SCHEMA/AGENT名, CORS
├── src/backend/
│   ├── config.py               # Settings(pydantic-settings)
│   ├── main.py                 # create_app(CORS + ルーター登録)
│   ├── cortex/client.py        # CortexAgentClient(sync httpx、transport注入可能)
│   └── routers/
│       ├── tasks.py            # MSW契約と同一のGET/POST /api/tasks(インメモリ)
│       └── agent.py            # POST /api/agent/messages → client.run()
└── tests/                      # TestClient + httpx.MockTransport(実アカウント不要)
```

- クライアントはsync(httpx.Client)。高並列化時にAsyncClient化する旨をコメント
- Run API: `POST {account_url}/api/v2/databases/{db}/schemas/{schema}/agents/{name}:run`
  - 非ストリーミング(`stream: false`, Accept: application/json)を既定とし、
    最終`response`オブジェクトの`content[].type=="text"`を結合して返す
  - `run_stream()`はSSEの`response.text.delta`をyieldする雛形
- テスト: httpx.MockTransportを注入しHTTPを完全モック。tasksはTestClient

## スキル構成

```
.claude/skills/snowflake-agents/
├── SKILL.md          # 使用タイミング・スタック表・索引・チェックリスト
├── architecture.md   # 多層設計規約 + CREATE AGENT/Run APIリファレンス
└── setup.md          # アカウント側手順(PAT→SQL実行順→CoWork確認)・検証の限界を明記
```

## エラーハンドリング戦略

- BFF: httpx例外/非2xxを502に正規化(詳細はログ)。設定不足は起動時に明示的エラー
- UDF: サブエージェント失敗時はエラー文字列を返しマスターの推論に委ねる(全体停止させない)

## テスト戦略

- backend: pytest(ルーター2種+クライアントのURL/認証ヘッダ/レスポンス解釈/エラー変換)
- snowflake/: 実行検証不可のため、構文は公式例準拠+スキルの手順書でカバー

## 実装の順序

1. snowflake/ SQL一式
2. backend/ 実装+テスト
3. スキル3ファイル
4. 統合(devcontainer・CLAUDE.md・README・settings.json)
5. 検証(backend四点セット)→コミット・push

## セキュリティ考慮事項

- PATはSecret(Snowflake側)と.env(BFF側)のみ。コード・フロントエンドに置かない
- External Access Integrationのネットワークルールは自アカウントのホストに限定
- BFFのCORSは開発オリジン(localhost:5173)のみ既定許可
