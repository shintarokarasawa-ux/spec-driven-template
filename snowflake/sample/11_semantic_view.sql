-- ============================================================================
-- 11: セマンティックビュー(Cortex Analyst用)
--
-- ANALYST_AGENTが自然言語→SQL変換に使う「データの意味づけ」。
-- ディメンション・メトリクスのCOMMENTがLLMのヒントになるため丁寧に書くこと。
-- 構文の詳細は公式ドキュメント(CREATE SEMANTIC VIEW)を参照。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

CREATE OR REPLACE SEMANTIC VIEW SALES_SEMANTIC_VIEW
  TABLES (
    orders AS SAMPLE_ORDERS
      PRIMARY KEY (ORDER_ID)
      COMMENT = '注文明細。1行=1注文'
  )
  DIMENSIONS (
    orders.REGION AS region
      COMMENT = '販売地域(関東・関西・九州など)',
    orders.PRODUCT AS product
      COMMENT = '商品名',
    orders.ORDER_DATE AS order_date
      COMMENT = '注文日'
  )
  METRICS (
    orders.TOTAL_AMOUNT AS SUM(AMOUNT)
      COMMENT = '売上金額の合計(円)',
    orders.ORDER_COUNT AS COUNT(ORDER_ID)
      COMMENT = '注文件数'
  )
  COMMENT = '売上サンプルのセマンティックビュー(Cortex Analyst用)';
