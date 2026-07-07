from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class Task(BaseModel):
    id: str
    title: str
    status: Literal["open", "done"]


class CreateTaskRequest(BaseModel):
    title: str = Field(min_length=1)


# フロントエンドのMSWハンドラ(frontend/src/mocks/handlers.ts)と同一契約。
# インメモリ実装のサンプル。実プロジェクトではDB/Snowflakeに置き換える
_INITIAL_TASKS = [
    Task(id="TASK-1", title="永続ドキュメントを作成する", status="done"),
    Task(id="TASK-2", title="ステアリングファイルを計画する", status="open"),
    Task(id="TASK-3", title="サンプル機能を実装する", status="open"),
]

_tasks: list[Task] = list(_INITIAL_TASKS)
_next_id: int = len(_INITIAL_TASKS) + 1


def reset_tasks() -> None:
    """テスト用: インメモリ状態を初期化する。"""
    global _next_id
    _tasks.clear()
    _tasks.extend(_INITIAL_TASKS)
    _next_id = len(_INITIAL_TASKS) + 1


@router.get("")
def list_tasks() -> list[Task]:
    return _tasks


@router.post("", status_code=201)
def create_task(body: CreateTaskRequest) -> Task:
    global _next_id
    task = Task(id=f"TASK-{_next_id}", title=body.title, status="open")
    _next_id += 1
    _tasks.append(task)
    return task
