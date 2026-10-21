from typing import Any, Dict, List, Optional
from app.services.github.client import github_client


def get_commits(
    owner: str,
    repo: str,
    per_page: int = 30,
    sha: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetch recent commits for a repository or specific branch/SHA.
    Endpoint: GET /repos/{owner}/{repo}/commits
    """
    params: Dict[str, Any] = {"per_page": min(per_page, 100)}
    if sha:
        params["sha"] = sha

    data = github_client.get(f"/repos/{owner}/{repo}/commits", params=params, allow_404=True)
    return data if isinstance(data, list) else []


def get_commit(owner: str, repo: str, commit_sha: str) -> Optional[Dict[str, Any]]:
    """
    Fetch single commit details, including message, author, stats, and changed files.
    Endpoint: GET /repos/{owner}/{repo}/commits/{ref}
    """
    return github_client.get(f"/repos/{owner}/{repo}/commits/{commit_sha}", allow_404=True)
