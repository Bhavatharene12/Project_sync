from typing import Any, Dict, List, Optional
from app.services.github.client import github_client


def get_pull_requests(
    owner: str,
    repo: str,
    state: str = "open",
    per_page: int = 30
) -> List[Dict[str, Any]]:
    """
    Fetch repository pull requests.
    Endpoint: GET /repos/{owner}/{repo}/pulls
    States: 'open', 'closed', 'all'
    """
    params = {"state": state, "per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/pulls", params=params, allow_404=True)
    return data if isinstance(data, list) else []


def get_pull_request(owner: str, repo: str, pull_number: int) -> Optional[Dict[str, Any]]:
    """
    Fetch specific pull request detail with review states and branch pointers.
    Endpoint: GET /repos/{owner}/{repo}/pulls/{pull_number}
    """
    return github_client.get(f"/repos/{owner}/{repo}/pulls/{pull_number}", allow_404=True)
