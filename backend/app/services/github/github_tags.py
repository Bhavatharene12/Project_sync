from typing import Any, Dict, List
from app.services.github.client import github_client


def get_tags(owner: str, repo: str, per_page: int = 30) -> List[Dict[str, Any]]:
    """
    Fetch repository git tags.
    Endpoint: GET /repos/{owner}/{repo}/tags
    """
    params = {"per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/tags", params=params, allow_404=True)
    return data if isinstance(data, list) else []
