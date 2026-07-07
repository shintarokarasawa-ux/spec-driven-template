-- ============================================================================
-- 20: サブエージェント(専門エージェント層)
--
-- 設計原則: サブエージェントは「狭い責務 + スコープされたデータアクセス」。
-- 1エージェント=1ドメインとし、パイプライン全体を持たせない。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

-- ---------------------------------------------------------------------------
-- サブ1: 売上データ分析(Cortex Analyst)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE AGENT ANALYST_AGENT
  COMMENT = '売上データへの自然言語クエリを担当する専門エージェント'
  PROFILE = '{"display_name": "Sales Analyst"}'
  FROM SPECIFICATION
  $$
  orchestration:
    budget:
      seconds: 60
      tokens: 16000

  instructions:
    response: "数値は根拠(集計条件)とともに簡潔に日本語で答える"
    orchestration: "売上・注文に関する質問はAnalystツールでSQLを生成して回答する"
    sample_questions:
      - question: "先月の地域別売上は？"

  tools:
    - tool_spec:
        type: "cortex_analyst_text_to_sql"
        name: "SalesAnalyst"
        description: "売上データ(注文明細)への自然言語クエリをSQLに変換して実行する"

  tool_resources:
    SalesAnalyst:
      semantic_view: "AGENT_DEMO_DB.AGENTS.SALES_SEMANTIC_VIEW"
      execution_environment:
        type: "warehouse"
        warehouse: "AGENT_WH"
  $$;

-- ---------------------------------------------------------------------------
-- サブ2: 社内ドキュメント検索(Cortex Search)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE AGENT SEARCH_AGENT
  COMMENT = '社内ドキュメント検索を担当する専門エージェント'
  PROFILE = '{"display_name": "Docs Search"}'
  FROM SPECIFICATION
  $$
  orchestration:
    budget:
      seconds: 60
      tokens: 16000

  instructions:
    response: "参照したドキュメントのタイトルを明記して日本語で答える"
    orchestration: "ポリシー・ガイド類の質問はSearchツールで根拠を検索してから回答する"
    sample_questions:
      - question: "返品は何日以内に受け付けていますか？"

  tools:
    - tool_spec:
        type: "cortex_search"
        name: "DocsSearch"
        description: "社内ドキュメント(ポリシー・ガイド)を全文検索する"

  tool_resources:
    DocsSearch:
      search_service: "AGENT_DEMO_DB.AGENTS.DOCS_SEARCH_SERVICE"
      max_results: 5
      title_column: "TITLE"
      id_column: "DOC_ID"
  $$;

GRANT USAGE ON AGENT ANALYST_AGENT TO ROLE AGENT_DEV_ROLE;
GRANT USAGE ON AGENT SEARCH_AGENT TO ROLE AGENT_DEV_ROLE;
