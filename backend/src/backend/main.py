from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import agent, tasks


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Agent BFF")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(tasks.router)
    app.include_router(agent.router)
    return app


# 起動: uv run uvicorn backend.main:app --reload --port 8000
app = create_app()
