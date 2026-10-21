import os
from pathlib import Path
from dotenv import load_dotenv

# Find backend/.env file regardless of current working directory
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_path = _backend_dir / ".env"

if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


class Settings:
    """Application configuration settings loaded from environment."""

    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "").strip()
    GITHUB_API_BASE_URL: str = "https://api.github.com"
    REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "15"))

    @classmethod
    def has_github_token(cls) -> bool:
        """Check if a valid GitHub personal access token is configured."""
        return bool(cls.GITHUB_TOKEN)


settings = Settings()
