-- ============================================================================
-- 01: サブエージェント呼び出し用の外部アクセス設定
--
-- Python UDF(21_agent_udfs.sql)が自アカウントのCortex Agents Run APIを
-- 呼び出すための Network Rule / Secret / External Access Integration。
-- 前提: PAT(Programmatic Access Token)を発行済み(スキルのsetup.md参照)
-- ============================================================================
USE ROLE ACCOUNTADMIN;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

-- 自アカウントのRESTエンドポイントのみ許可(スコープを広げない)
CREATE OR REPLACE NETWORK RULE AGENT_API_NETWORK_RULE
  MODE = EGRESS
  TYPE = HOST_PORT
  VALUE_LIST = ('<account_identifier>.snowflakecomputing.com');  -- TODO: 自アカウントのホスト名

-- ⚠️ 実運用ではSQLファイルにPATを直書きしない(Snowsightから設定するか、
--    実行後にこのファイルの値を消す。このファイルをコミットする際は必ずプレースホルダに戻す)
CREATE OR REPLACE SECRET AGENT_API_PAT
  TYPE = GENERIC_STRING
  SECRET_STRING = '<YOUR_PAT>';  -- TODO

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION AGENT_API_INTEGRATION
  ALLOWED_NETWORK_RULES = (AGENT_API_NETWORK_RULE)
  ALLOWED_AUTHENTICATION_SECRETS = (AGENT_API_PAT)
  ENABLED = TRUE;

GRANT USAGE ON INTEGRATION AGENT_API_INTEGRATION TO ROLE AGENT_DEV_ROLE;
GRANT READ ON SECRET AGENT_API_PAT TO ROLE AGENT_DEV_ROLE;
