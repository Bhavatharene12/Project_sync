from typing import Any, Dict, List
from app.services.github.client import github_client


def get_contributors(owner: str, repo: str, per_page: int = 30) -> List[Dict[str, Any]]:
    """
    Fetch repository contributors and contribution counts.
    Endpoint: GET /repos/{owner}/{repo}/contributors
    """
    params = {"per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/contributors", params=params, allow_404=True)
    return data if isinstance(data, list) else []
