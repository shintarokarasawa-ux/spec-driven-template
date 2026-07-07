-- ============================================================================
-- 22: マスターエージェント(オーケストレーション層)
--
-- ユーザーの質問を受け、genericツール(=サブエージェント呼び出しUDF)に振り分ける。
-- CoWork UIからこのエージェントを開くと、多層構造がそのまま使える。
-- 注意: マクロなパイプライン制御(定期バッチ等)はここに持たせず、
--       Tasks/ストアドプロシージャ側で行うこと(architecture.md参照)。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

CREATE OR REPLACE AGENT MASTER_AGENT
  COMMENT = '質問を専門サブエージェントに振り分けるマスターエージェント'
  PROFILE = '{"display_name": "Master Assistant"}'
  FROM SPECIFICATION
  $$
  orchestration:
    budget:
      seconds: 120
      tokens: 32000

  instructions:
    response: "サブエージェントの回答を統合し、出典(どのエージェントか)を添えて日本語で答える"
    orchestration: >
      売上・注文・数値集計に関する質問は ask_analyst を使う。
      ポリシー・ガイド・社内ドキュメントに関する質問は ask_search を使う。
      両方が必要な複合質問は、それぞれを呼び出して統合する。
      どちらにも該当しない場合はツールを使わず、その旨を答える。
    sample_questions:
      - question: "先月の関東の売上と、返品ポリシーを教えて"

  tools:
    - tool_spec:
        type: "generic"
        name: "ask_analyst"
        description: "売上データ分析の専門エージェントに質問する。引数: question(日本語の質問文)"
    - tool_spec:
        type: "generic"
        name: "ask_search"
        description: "社内ドキュメント検索の専門エージェントに質問する。引数: question(日本語の質問文)"

  tool_resources:
    ask_analyst:
      user_defined_function: "AGENT_DEMO_DB.AGENTS.ASK_ANALYST"
      execution_environment:
        type: "warehouse"
        warehouse: "AGENT_WH"
    ask_search:
      user_defined_function: "AGENT_DEMO_DB.AGENTS.ASK_SEARCH"
      execution_environment:
        type: "warehouse"
        warehouse: "AGENT_WH"
  $$;

GRANT USAGE ON AGENT MASTER_AGENT TO ROLE AGENT_DEV_ROLE;
