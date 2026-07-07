-- ============================================================================
-- 21: サブエージェント呼び出しUDF(多層構造のブリッジ)
--
-- マスターエージェントはgenericツールとしてこれらのUDFを持ち、
-- UDFがRun API経由でサブエージェントを呼び出す(公式の多層パターン)。
-- 失敗時はエラー文字列を返し、マスターの推論に委ねる(全体を止めない)。
-- ============================================================================
USE ROLE AGENT_DEV_ROLE;
USE SCHEMA AGENT_DEMO_DB.AGENTS;

-- 汎用ブリッジ: 指定エージェントに質問を投げ、最終応答テキストを返す
CREATE OR REPLACE FUNCTION ASK_AGENT(agent_name STRING, question STRING)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = 3.11
HANDLER = 'ask'
EXTERNAL_ACCESS_INTEGRATIONS = (AGENT_API_INTEGRATION)
SECRETS = ('pat' = AGENT_API_PAT)
PACKAGES = ('requests')
AS
$$
import json

import _snowflake
import requests

# TODO: 自アカウントのホスト名(01_agent_access.sqlのNetwork Ruleと一致させる)
ACCOUNT_HOST = "<account_identifier>.snowflakecomputing.com"
DATABASE = "AGENT_DEMO_DB"
SCHEMA = "AGENTS"


def ask(agent_name: str, question: str) -> str:
    token = _snowflake.get_generic_secret_string("pat")
    url = (
        f"https://{ACCOUNT_HOST}/api/v2/databases/{DATABASE}"
        f"/schemas/{SCHEMA}/agents/{agent_name}:run"
    )
    payload = {
        "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}],
        "stream": False,
    }
    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=300,
        )
        response.raise_for_status()
        content = response.json().get("content", [])
        texts = [item.get("text", "") for item in content if item.get("type") == "text"]
        return "\n".join(texts) or json.dumps(response.json(), ensure_ascii=False)
    except Exception as exc:  # サブの失敗で全体を止めず、呼び出し元の推論に委ねる
        return f"[{agent_name} error] {exc}"
$$;

-- マスターに公開する型付きラッパー(エージェント名を固定し、責務をスコープする)
CREATE OR REPLACE FUNCTION ASK_ANALYST(question STRING)
RETURNS STRING
AS $$ SELECT ASK_AGENT('ANALYST_AGENT', question) $$;

CREATE OR REPLACE FUNCTION ASK_SEARCH(question STRING)
RETURNS STRING
AS $$ SELECT ASK_AGENT('SEARCH_AGENT', question) $$;

GRANT USAGE ON FUNCTION ASK_AGENT(STRING, STRING) TO ROLE AGENT_DEV_ROLE;
GRANT USAGE ON FUNCTION ASK_ANALYST(STRING) TO ROLE AGENT_DEV_ROLE;
GRANT USAGE ON FUNCTION ASK_SEARCH(STRING) TO ROLE AGENT_DEV_ROLE;
