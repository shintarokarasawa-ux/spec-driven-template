# アカウント側セットアップ手順

テンプレートのSQL資産を実Snowflakeアカウントにデプロイする定型手順。
⚠️ このテンプレートは実アカウントでの実行検証を行っていないため、
初回は1ファイルずつ実行し、エラー時は公式ドキュメントの最新構文と突き合わせること。

## 0. 前提

- ACCOUNTADMIN(初回のみ)と開発用ユーザー
- Snowflake CLI(`snow`)またはSnowsightワークシート
- アカウント識別子(`<account_identifier>.snowflakecomputing.com`)

## 1. PAT(Programmatic Access Token)の発行

1. Snowsight → 自分のユーザー → Programmatic access tokens → Generate new token
   (対象ロール: `AGENT_DEV_ROLE`、有効期限は運用ポリシーに合わせる)
2. トークン値を控える(再表示不可)。用途は2箇所:
   - Snowflake内: `01_agent_access.sql` のSecret(サブエージェント呼び出しUDF用)
   - BFF: `backend/.env` の `SNOWFLAKE_PAT`
3. **有効期限の失効前ローテーションを運用に組み込む**(SecretのALTERと.envの差し替え)

## 2. SQLの実行(番号順)

```bash
snow sql -f snowflake/setup/00_infra.sql       # ロール・WH・DB(要ACCOUNTADMIN)
#   → 末尾のGRANT ROLE ... TO USER を自分のユーザーに書き換えて実行
snow sql -f snowflake/setup/01_agent_access.sql # Network Rule・Secret・EAI
#   → <account_identifier> と <YOUR_PAT> を置換。実行後はファイル内のPATを必ず消す
snow sql -f snowflake/sample/10_sample_data.sql
snow sql -f snowflake/sample/11_semantic_view.sql
snow sql -f snowflake/sample/12_search_service.sql
snow sql -f snowflake/agents/20_sub_agents.sql
snow sql -f snowflake/agents/21_agent_udfs.sql  # → ACCOUNT_HOST を置換
snow sql -f snowflake/agents/22_master_agent.sql
```

## 3. 疎通確認(内側から順に)

```sql
-- (1) サブエージェント単体(SnowsightのAIエリア or Run API)
-- (2) ブリッジUDF
SELECT ASK_ANALYST('先月の地域別売上は？');
SELECT ASK_SEARCH('返品は何日以内？');
-- (3) マスターエージェント(複合質問)
--     CoWork でMASTER_AGENTを開き「先月の関東の売上と、返品ポリシーを教えて」
```

失敗時の切り分け: UDFが`[XXX error]`を返す場合はNetwork Rule/Secret/ホスト名を確認。
エージェントがツールを選ばない場合はorchestration指示とツールdescriptionを具体化する。

## 4. CoWorkでの利用

- CoWorkからMASTER_AGENTを開けば多層構造がそのまま使える
- CoWork側でマスターエージェントを新規作成し、カスタムツールとして
  `ASK_XXX` UDFを追加する構成も可能(UI操作。エージェント定義をSQL管理する本テンプレートの
  方式と二重管理にならないよう、どちらかに寄せる)

## 5. BFF(backend/)の接続

```bash
cd backend
cp .env.example .env   # SNOWFLAKE_ACCOUNT_URL と SNOWFLAKE_PAT を設定
uv run uvicorn backend.main:app --reload --port 8000
curl -X POST localhost:8000/api/agent/messages \
  -H 'Content-Type: application/json' -d '{"message": "先月の売上は？"}'
```

フロントエンドから使う場合は `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_MOCK=false
```

## セキュリティ注意

- PATをgit管理下のファイルに残さない(`01_agent_access.sql`実行後に必ずプレースホルダへ戻す)
- Network Ruleは自アカウントホストのみ。ワイルドカードにしない
- BFFの`.env`はgitignore対象。フロントエンドにPATを渡さない
