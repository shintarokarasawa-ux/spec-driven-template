from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """環境変数(.env)から読み込む設定。キー名は.env.example参照。"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # 例: https://<account_identifier>.snowflakecomputing.com
    snowflake_account_url: str = ""
    snowflake_pat: SecretStr = SecretStr("")
    snowflake_agent_database: str = "AGENT_DEMO_DB"
    snowflake_agent_schema: str = "AGENTS"
    snowflake_agent_name: str = "MASTER_AGENT"
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
