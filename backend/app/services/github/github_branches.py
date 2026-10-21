from typing import Any, Dict, List, Optional
from app.services.github.client import github_client


def get_branches(owner: str, repo: str, per_page: int = 100) -> List[Dict[str, Any]]:
    """
    Fetch repository branches with pagination support.
    Endpoint: GET /repos/{owner}/{repo}/branches
    """
    params = {"per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/branches", params=params, allow_404=True)
    return data if isinstance(data, list) else []


def get_branch(owner: str, repo: str, branch_name: str) -> Optional[Dict[str, Any]]:
    """
    Fetch specific branch details including commit SHA and protection rules.
    Endpoint: GET /repos/{owner}/{repo}/branches/{branch}
    """
    return github_client.get(f"/repos/{owner}/{repo}/branches/{branch_name}", allow_404=True)
