-- ============================================================================
-- 10: サンプルデータ
--
-- サブエージェントの動作確認用。実プロジェクトでは自データに置き換え、
-- 11(セマンティックビュー)・12(Searchサービス)の参照先を変更する。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE WAREHOUSE AGENT_WH;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

-- 構造化データ: 注文明細(Cortex Analyst = ANALYST_AGENT用)
CREATE OR REPLACE TABLE SAMPLE_ORDERS (
  ORDER_ID   INTEGER,
  ORDER_DATE DATE,
  REGION     STRING,
  PRODUCT    STRING,
  AMOUNT     NUMBER(12, 2)
);

INSERT INTO SAMPLE_ORDERS VALUES
  (1, '2026-06-01', '関東', 'Widget A', 120000),
  (2, '2026-06-03', '関西', 'Widget B',  85000),
  (3, '2026-06-10', '関東', 'Widget B',  64000),
  (4, '2026-06-15', '九州', 'Widget A',  47000),
  (5, '2026-07-01', '関東', 'Widget C', 156000),
  (6, '2026-07-02', '関西', 'Widget A',  92000);

-- 非構造化データ: 社内ドキュメント(Cortex Search = SEARCH_AGENT用)
CREATE OR REPLACE TABLE SAMPLE_DOCUMENTS (
  DOC_ID   STRING,
  TITLE    STRING,
  CATEGORY STRING,
  CONTENT  STRING
);

INSERT INTO SAMPLE_DOCUMENTS VALUES
  ('DOC-1', '返品ポリシー', 'policy',
   '商品到着後30日以内であれば返品を受け付けます。開封済みの場合は手数料10%を申し受けます。'),
  ('DOC-2', '配送ガイド', 'guide',
   '関東・関西は翌日配送、その他の地域は2〜3営業日でお届けします。'),
  ('DOC-3', '保証規定', 'policy',
   'Widgetシリーズの保証期間は購入日から1年間です。自然故障のみが対象です。');
