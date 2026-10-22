import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.config import settings
from app.routes.github import router as github_router
from app.routes.scm import router as scm_router
from app.routes.executor import router as executor_router
from app.routes.assistant import router as assistant_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sync.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    if settings.has_github_token():
        logger.info("GitHub API configured with GITHUB_TOKEN (authenticated mode, 5,000 req/hr).")
    else:
        logger.warning(
            "No GITHUB_TOKEN configured in backend/.env. "
            "Running in unauthenticated mode (max 60 req/hr per IP)."
        )
    yield
    logger.info("Sync Backend shutting down.")


app = FastAPI(
    title="Sync API",
    description="Sync - AI Software Configuration Management (SCM) Assistant API",
    version="2.5.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(github_router)
app.include_router(scm_router)
app.include_router(executor_router)
app.include_router(assistant_router)


@app.get("/")
def home():
    """Root health and welcome endpoint."""
    return {
        "message": "Welcome to Sync Backend 🚀"
    }