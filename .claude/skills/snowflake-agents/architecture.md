# 多層エージェント設計規約(Snowflake Cortex Agents)

## 全体アーキテクチャ

```
[frontend] ──/api/*──▶ [backend/ BFF] ──Run API──▶ [MASTER_AGENT]
                                                     │ generic tool = UDF
                                                     ▼
                                       [ASK_XXX UDF(External Access)]
                                        ├──▶ ANALYST_AGENT(Cortex Analyst)
                                        ├──▶ SEARCH_AGENT(Cortex Search)
                                        └──▶ (追加サブエージェント)
```

CoWorkからはMASTER_AGENTを直接開いて使える(BFFはWebアプリ向けの経路)。

## 設計原則(最重要)

1. **サブエージェントは狭い責務+スコープされたデータアクセス**。
   1エージェント=1ドメイン(例: 売上分析、ドキュメント検索)。ツールは最小限に絞る
2. **マクロなオーケストレーションはLLMに持たせない**。
   定期バッチ・パイプライン制御はTasks/ストアドプロシージャが所有し、
   エージェントは「1つの束ねられた質問に答える」単位に留める。
   失敗は検証エラーとして顕在化させる(黙殺されるデータ欠損を作らない)
3. **層間の契約は型付きにする**。UDFラッパー(`ASK_ANALYST(question STRING) RETURNS STRING`)で
   エージェント名を固定し、マスターが任意のエージェントを呼べる状態にしない
4. **UDFブリッジは失敗を握りつぶさず、エラー文字列で返す**。
   マスターの推論が「その観点は欠損」と扱えるようにする(全体を止めない)

## サブエージェントの分割基準

| 分けるべき | 分けなくてよい |
|-----------|--------------|
| データドメインが違う(売上 vs 人事) | 同一セマンティックビュー内の質問の種類 |
| ツール権限を分離したい | 応答スタイルの違い(instructionsで調整) |
| 実行予算(budget)を個別に絞りたい | 単なる質問カテゴリの違い |

## CREATE AGENT 仕様リファレンス(2026-07時点)

```sql
CREATE OR REPLACE AGENT <name>
  COMMENT = '...'
  PROFILE = '{"display_name": "..."}'
  FROM SPECIFICATION
  $$
  models:
    orchestration: "claude-4-sonnet"   -- 省略時はアカウント既定

  orchestration:
    budget: { seconds: 60, tokens: 16000 }

  instructions:
    response: "応答生成の指示"
    orchestration: "ツール選択の指示(どの質問でどのツールを使うか)"
    sample_questions:
      - question: "..."

  tools:
    - tool_spec: { type: "cortex_analyst_text_to_sql", name: "...", description: "..." }
    - tool_spec: { type: "cortex_search", name: "...", description: "..." }
    - tool_spec: { type: "generic", name: "...", description: "..." }  -- UDF/SP

  tool_resources:
    <analystツール名>:
      semantic_view: "db.schema.view"
      execution_environment: { type: "warehouse", warehouse: "WH" }
    <searchツール名>:
      search_service: "db.schema.service"
      max_results: 5
      title_column: "TITLE"
      id_column: "ID"
    <genericツール名>:
      user_defined_function: "db.schema.function"
      execution_environment: { type: "warehouse", warehouse: "WH" }
  $$;
```

- 更新は `ALTER AGENT <name> MODIFY LIVE VERSION SET SPECIFICATION = $$...$$;`
- 利用権限: `GRANT USAGE ON AGENT <name> TO ROLE <role>;` +
  ツール先オブジェクト(UDF/ビュー等)の権限も必要
- 実行には `SNOWFLAKE.CORTEX_USER`(または `CORTEX_AGENT_USER`)データベースロール

## Run API リファレンス(2026-07時点)

```
POST {account_url}/api/v2/databases/{db}/schemas/{schema}/agents/{name}:run
Authorization: Bearer <PAT>
Content-Type: application/json
Accept: application/json(非ストリーミング) | text/event-stream(SSE)

body: {
  "messages": [{"role": "user", "content": [{"type": "text", "text": "質問"}]}],
  "stream": false,
  "thread_id": <会話継続時のみ>
}
```

- 非ストリーミング応答: `{"role": "assistant", "content": [{"type": "text", ...}], "metadata": {...}}`
  → `content[].type == "text"` を結合したものが応答テキスト
- SSEイベント: `response.status` / `response.text.delta` / `response.thinking.delta` /
  `response.tool_use` / `response.tool_result` / 最後に全体を含む `response`
- タイムアウト: リクエストは15分で打ち切られる
- 実装は `backend/src/backend/cortex/client.py`(BFF)と
  `snowflake/agents/21_agent_udfs.sql`(UDF)が参照実装

## 命名規約

- エージェント: `<役割>_AGENT`(例: ANALYST_AGENT)。マスターは `MASTER_AGENT`
- ブリッジUDF: `ASK_<役割>`(型付きラッパー)、汎用は `ASK_AGENT`
- SQLファイル: `<2桁番号>_<内容>.sql`(番号=依存順=実行順)

## レビュー観点

- [ ] マスターのorchestration指示に「どの質問でどのサブを使うか」と
  「該当しない場合の振る舞い」が明記されているか
- [ ] サブエージェントのツールが責務に対して最小か(不要なcode_execution等がないか)
- [ ] budget(seconds/tokens)が層ごとに設定されているか(マスター>サブ)
- [ ] UDFのNetwork Rule/Secretのスコープが最小か
- [ ] BFFがCortexAgentClient経由で呼んでいるか(素のfetch/requestsを書いていないか)
- [ ] 上流エラーが502に正規化され、PAT等の秘密がエラーメッセージに漏れていないか
