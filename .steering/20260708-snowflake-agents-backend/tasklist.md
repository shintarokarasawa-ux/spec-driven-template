# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 未完了タスク(`[ ]`)を残したまま作業を終了しない

---

## フェーズ1: snowflake/ SQL資産

- [x] setup/00_infra.sql, setup/01_agent_access.sql
- [x] sample/10_sample_data.sql, 11_semantic_view.sql, 12_search_service.sql
- [x] agents/20_sub_agents.sql, 21_agent_udfs.sql, 22_master_agent.sql

## フェーズ2: backend/ FastAPI BFF

- [x] pyproject.toml と .env.example(+ backend/README.md)
- [x] config.py(Settings)
- [x] cortex/client.py(run / run_stream、transport注入)
- [x] routers/tasks.py(MSW契約と同一)+ routers/agent.py
- [x] main.py(create_app、CORS)
- [x] tests/(tasks・agent・client)= 9件パス

## フェーズ3: snowflake-agentsスキル

- [x] SKILL.md
- [x] architecture.md(設計規約+DDL/Run APIリファレンス)
- [x] setup.md(アカウント側手順・検証の限界)

## フェーズ4: 統合と検証

- [x] settings.json / devcontainer.json(backend sync・snow CLI・サブシェル修正)
- [x] CLAUDE.md / README.md 更新
- [x] backend: uv sync / pytest(9件) / ruff / mypy 全て成功(frontendも回帰なし)
- [x] コミット・push

---

## 実装後の振り返り

### 実装完了日
2026-07-08

### 計画と実績の差分

**計画と異なった点**:
- ほぼ設計どおり。UDFブリッジは当初サブごとに個別UDFの想定だったが、
  汎用`ASK_AGENT(agent_name, question)` + 型付きSQLラッパー(`ASK_ANALYST`等)の
  2段構成にしてDRYと責務スコープを両立した
- devcontainerのpostCreateCommandに既存バグを発見(frontendへのcdがサブシェルでなく
  後続コマンドのカレントを汚染)。今回のbackend追加に合わせて修正

### 学んだこと

- CoWorkは旧Snowflake Intelligenceのリブランド(2026 Summit)で、マスターエージェントの
  UI面。実体はCREATE AGENTで管理し、多層化はUDF→Run APIブリッジが公式パターン
- アカウントなしで整備する場合、「BFFはHTTPモックで完全検証」「SQLは公式構文準拠+
  未検証であることの明示+1ファイルずつのデプロイ手順書」という分担が現実的
- 変化の速い領域(Summit直後)は、スキルに「2026-07時点」とバージョン前提を明記して
  将来の乖離を検出しやすくする

### 次回への改善提案
- 実アカウントでの疎通確認ができたら、setup.mdの「未検証」注記を実測結果に更新する
- ストリーミング応答(run_stream)をフロントエンドまで通す実例は需要が出たら追加
