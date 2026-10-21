import base64
from typing import Any, Dict, Optional
from app.services.github.client import github_client


def get_repository(owner: str, repo: str) -> Dict[str, Any]:
    """
    Fetch repository metadata from GitHub.
    Endpoint: GET /repos/{owner}/{repo}
    """
    return github_client.get(f"/repos/{owner}/{repo}")


def get_readme(owner: str, repo: str) -> Optional[str]:
    """
    Fetch and decode repository README content.
    Endpoint: GET /repos/{owner}/{repo}/readme
    Returns decoded UTF-8 string, or None if README is not present.
    """
    data = github_client.get(f"/repos/{owner}/{repo}/readme", allow_404=True)
    if not data or "content" not in data:
        return None

    try:
        encoded_content = data["content"]
        decoded_bytes = base64.b64decode(encoded_content)
        return decoded_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return None


def get_languages(owner: str, repo: str) -> Dict[str, int]:
    """
    Fetch language breakdown in bytes.
    Endpoint: GET /repos/{owner}/{repo}/languages
    """
    return github_client.get(f"/repos/{owner}/{repo}/languages", allow_404=True) or {}


def get_topics(owner: str, repo: str) -> list[str]:
    """
    Fetch repository topic tags.
    Endpoint: GET /repos/{owner}/{repo}/topics
    """
    data = github_client.get(f"/repos/{owner}/{repo}/topics", allow_404=True)
    if data and "names" in data:
        return data["names"]
    return []
