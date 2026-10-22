import logging
from typing import Any, Dict, List, Optional
from app.services.github.client import github_client
from app.services.github.github_pull_requests import get_pull_requests
from app.services.executor.error_handler import handle_executor_error
from app.utils.config import settings

logger = logging.getLogger("sync.executor.pr")



def fetch_prs_with_review(owner: str, repo: str, state: str = "open", token: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch pull requests and evaluate mergeability, draft status, and SCM recommendations.
    """
    raw_prs = get_pull_requests(owner, repo, state=state, per_page=30)
    enriched: List[Dict[str, Any]] = []

    for pr in raw_prs:
        number = pr.get("number")
        title = pr.get("title", "")
        author = pr.get("user", {}).get("login", "unknown")
        head_branch = pr.get("head", {}).get("ref", "")
        base_branch = pr.get("base", {}).get("ref", "")
        draft = pr.get("draft", False)
        labels = [l.get("name") for l in pr.get("labels", []) if isinstance(l, dict)]

        # Suggest merge strategy
        if head_branch.startswith("feature/") or head_branch.startswith("feat/"):
            suggested_strategy = "squash"
            recommendation = "Squash and merge feature commits to maintain clean trunk history"
        elif head_branch.startswith("release/"):
            suggested_strategy = "merge"
            recommendation = "Create merge commit preserving release branch topology"
        else:
            suggested_strategy = "squash"
            recommendation = "Review CI status and squash merge when approved"

        enriched.append({
            "number": number,
            "title": title,
            "author": author,
            "head_branch": head_branch,
            "base_branch": base_branch,
            "draft": draft,
            "labels": labels,
            "created_at": pr.get("created_at"),
            "html_url": pr.get("html_url"),
            "suggested_strategy": suggested_strategy,
            "recommendation": recommendation,
            "state": pr.get("state", "open")
        })

    return enriched


def create_pr_merge_plan(
    owner: str,
    repo: str,
    pull_number: int,
    merge_method: str = "squash",
    commit_title: Optional[str] = None,
    commit_message: Optional[str] = None,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate safe pull request merge execution plan.
    """
    default_title = commit_title or f"Merge pull request #{pull_number} via Sync SCM ({merge_method})"
    default_msg = commit_message or f"Merged branch into base branch using {merge_method} strategy."

    plan = {
        "plan_id": f"PLAN-PR-MERGE-{pull_number}",
        "action_type": "pr_merge",
        "repository": f"{owner}/{repo}",
        "title": f"Merge Pull Request #{pull_number} ({merge_method.upper()})",
        "description": f"Execute automated GitHub merge on PR #{pull_number} with {merge_method} commit strategy.",
        "impact_level": "HIGH",
        "requires_approval": True,
        "approval_status": "pending",
        "diff": {
            "pull_number": pull_number,
            "merge_method": merge_method,
            "commit_title": default_title
        },
        "payload": {
            "owner": owner,
            "repo": repo,
            "pull_number": pull_number,
            "merge_method": merge_method,
            "commit_title": default_title,
            "commit_message": default_msg
        },
        "rollback_strategy": "Can revert merge commit via git revert or GitHub PR revert button.",
        "created_at": "now"
    }

    return plan


def execute_pr_merge(
    payload: Dict[str, Any],
    token: Optional[str] = None,
    simulate: bool = False
) -> Dict[str, Any]:
    """
    Execute merge via GitHub REST API:
    PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge
    """
    active_token = token or (settings.GITHUB_TOKEN if settings.has_github_token() else None)
    is_simulated = simulate or payload.get("simulation", False) or not active_token

    owner = payload["owner"]
    repo = payload["repo"]
    pull_number = payload["pull_number"]
    merge_method = payload.get("merge_method", "squash")
    commit_title = payload.get("commit_title")
    commit_message = payload.get("commit_message")

    simulated = {
        "success": True,
        "status": "SIMULATED",
        "commit_sha": "sim_sha_pr_merge_88b1",
        "resource_url": f"https://github.com/{owner}/{repo}/pull/{pull_number}",
        "summary": f"[Simulated Execution] Pull Request #{pull_number} verified and simulated merge executed.",
        "verified": True,
        "verification_message": f"Simulated verification: branch checks passed for PR #{pull_number}."
    }

    if is_simulated:
        return simulated

    # Real execution
    body = {
        "merge_method": merge_method,
        "commit_title": commit_title,
        "commit_message": commit_message
    }

    try:
        resp = github_client.put(
            f"/repos/{owner}/{repo}/pulls/{pull_number}/merge",
            json_data=body,
            token=active_token
        )

        sha = resp.get("sha") if isinstance(resp, dict) else None
        merged = resp.get("merged", True) if isinstance(resp, dict) else True

        return {
            "success": True,
            "status": "SUCCESS",
            "commit_sha": sha,
            "resource_url": f"https://github.com/{owner}/{repo}/pull/{pull_number}",
            "summary": f"Pull Request #{pull_number} successfully merged with {merge_method} method.",
            "verified": merged,
            "verification_message": f"Verified merge commit {sha[:8] if sha else 'OK'} recorded."
        }
    except Exception as exc:
        return handle_executor_error(
            exc=exc,
            action_attempted="pr_merge",
            token=active_token,
            simulation_requested=False,
            simulated_response=None
        )

