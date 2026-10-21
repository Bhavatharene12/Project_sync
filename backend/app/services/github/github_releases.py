from typing import Any, Dict, List, Optional
from app.services.github.client import github_client


def get_releases(owner: str, repo: str, per_page: int = 20) -> List[Dict[str, Any]]:
    """
    Fetch repository published releases.
    Endpoint: GET /repos/{owner}/{repo}/releases
    """
    params = {"per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/releases", params=params, allow_404=True)
    return data if isinstance(data, list) else []


def get_latest_release(owner: str, repo: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the latest published release.
    Endpoint: GET /repos/{owner}/{repo}/releases/latest
    """
    return github_client.get(f"/repos/{owner}/{repo}/releases/latest", allow_404=True)
