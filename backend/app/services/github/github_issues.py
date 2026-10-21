from typing import Any, Dict, List
from app.services.github.client import github_client


def get_issues(
    owner: str,
    repo: str,
    state: str = "open",
    per_page: int = 30,
    include_pull_requests: bool = False
) -> List[Dict[str, Any]]:
    """
    Fetch repository issues. By default, filters out pull requests because GitHub's
    /issues endpoint returns both issues and PRs.
    Endpoint: GET /repos/{owner}/{repo}/issues
    """
    params = {"state": state, "per_page": min(per_page, 100)}
    data = github_client.get(f"/repos/{owner}/{repo}/issues", params=params, allow_404=True)
    if not isinstance(data, list):
        return []

    if not include_pull_requests:
        # Pull requests have a "pull_request" key in their issue object
        return [item for item in data if "pull_request" not in item]

    return data
