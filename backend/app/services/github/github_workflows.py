from typing import Any, Dict, List, Optional, Union
from app.services.github.client import github_client


def get_workflows(owner: str, repo: str) -> List[Dict[str, Any]]:
    """
    Fetch all GitHub Actions workflow configurations.
    Endpoint: GET /repos/{owner}/{repo}/actions/workflows
    """
    data = github_client.get(f"/repos/{owner}/{repo}/actions/workflows", allow_404=True)
    if data and isinstance(data, dict) and "workflows" in data:
        return data["workflows"]
    return []


def get_workflow_runs(
    owner: str,
    repo: str,
    workflow_id: Optional[Union[str, int]] = None,
    per_page: int = 20
) -> List[Dict[str, Any]]:
    """
    Fetch recent workflow execution runs.
    Endpoint:
      - If workflow_id provided: GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs
      - Otherwise: GET /repos/{owner}/{repo}/actions/runs
    """
    params = {"per_page": min(per_page, 100)}
    if workflow_id:
        endpoint = f"/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
    else:
        endpoint = f"/repos/{owner}/{repo}/actions/runs"

    data = github_client.get(endpoint, params=params, allow_404=True)
    if data and isinstance(data, dict) and "workflow_runs" in data:
        return data["workflow_runs"]
    return []
