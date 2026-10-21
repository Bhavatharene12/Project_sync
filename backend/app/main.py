from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.github import router as github_router

app = FastAPI(
    title="Sync API",
    version="1.0.0"
)

# Enable CORS
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

app.include_router(github_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Sync Backend 🚀"
    }