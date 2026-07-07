-- ============================================================================
-- 12: Cortex Searchサービス(SEARCH_AGENT用)
--
-- 非構造化ドキュメントの検索サービス。CONTENTを検索対象、CATEGORYをフィルタ列とする。
-- TARGET_LAGはソーステーブルの更新頻度に合わせて調整する。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

CREATE OR REPLACE CORTEX SEARCH SERVICE DOCS_SEARCH_SERVICE
  ON CONTENT
  ATTRIBUTES CATEGORY
  WAREHOUSE = AGENT_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT DOC_ID, TITLE, CATEGORY, CONTENT
    FROM SAMPLE_DOCUMENTS
  );
