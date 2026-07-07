from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.config import Settings, get_settings
from backend.cortex.client import CortexAgentClient, CortexAgentError

router = APIRouter(prefix="/api/agent", tags=["agent"])


class AgentMessageRequest(BaseModel):
    message: str
    thread_id: int | None = None


class AgentMessageResponse(BaseModel):
    text: str


def get_client(settings: Annotated[Settings, Depends(get_settings)]) -> CortexAgentClient:
    if not settings.snowflake_account_url:
        raise HTTPException(
            status_code=503,
            detail="SNOWFLAKE_ACCOUNT_URLが未設定です(backend/.env.example参照)",
        )
    return CortexAgentClient(
        account_url=settings.snowflake_account_url,
        pat=settings.snowflake_pat.get_secret_value(),
        database=settings.snowflake_agent_database,
        schema=settings.snowflake_agent_schema,
        agent_name=settings.snowflake_agent_name,
    )


@router.post("/messages")
def post_message(
    body: AgentMessageRequest,
    client: Annotated[CortexAgentClient, Depends(get_client)],
) -> AgentMessageResponse:
    try:
        text = client.run(body.message, body.thread_id)
    except (CortexAgentError, httpx.HTTPError) as exc:
        # 上流(Snowflake)の失敗は502に正規化する
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return AgentMessageResponse(text=text)
