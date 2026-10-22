"""
Service for Upstream Fork Synchronizer.
Detects fork divergence from parent upstream and synchronizes branches with 1-click.
"""
from typing import Dict, Any
import logging
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.fork")


def get_fork_status(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Checks if repository is a fork, finds parent upstream, and computes divergence.
    """
    owner, repo = parse_github_url(repo_url)

    repo_data = {}
    try:
        repo_data = github_client.get(f"/repos/{owner}/{repo}", token=token, allow_404=True) or {}
    except Exception as e:
        logger.debug(f"Repo data fetch error: {e}")
        repo_data = {}

    is_fork = repo_data.get("fork", False)
    default_branch = repo_data.get("default_branch", "main")

    if not is_fork:
        return {
            "is_fork": False,
            "repository": f"{owner}/{repo}",
            "default_branch": default_branch,
            "message": "This repository is a standalone root repository (not a GitHub fork).",
            "education": {
                "title": "Standalone Repository — Upstream Sync Not Required",
                "explanation": (
                    "This repository was created directly as an original root project, not forked from another repository. "
                    "Upstream synchronization applies when you fork a repository (e.g., an open-source project or coursework assignment) "
                    "and need to pull changes made to the original parent project into your personal copy."
                ),
                "concept_steps": [
                    "Original Project (Upstream) releases new features or assignment updates",
                    "Your Fork (Origin) falls behind by N commits",
                    "Sync AI Assistant fast-forwards your branch to match upstream with 1-click"
                ]
            }
        }

    parent = repo_data.get("parent") or {}
    parent_full_name = parent.get("full_name")
    parent_owner = parent.get("owner", {}).get("login")
    parent_repo = parent.get("name")
    parent_default_branch = parent.get("default_branch", "main")

    # Compare fork with upstream parent
    compare_data = {}
    try:
        compare_data = github_client.get(
            f"/repos/{parent_owner}/{parent_repo}/compare/{parent_default_branch}...{owner}:{default_branch}",
            token=token,
            allow_404=True
        ) or {}
    except Exception as e:
        logger.debug(f"Fork compare error: {e}")
        compare_data = {}

    behind_by = compare_data.get("behind_by", 0)
    ahead_by = compare_data.get("ahead_by", 0)
    status_str = compare_data.get("status", "identical")

    return {
        "is_fork": True,
        "repository": f"{owner}/{repo}",
        "default_branch": default_branch,
        "upstream": {
            "full_name": parent_full_name,
            "owner": parent_owner,
            "repo": parent_repo,
            "default_branch": parent_default_branch,
            "html_url": parent.get("html_url")
        },
        "sync_status": {
            "behind_by": behind_by,
            "ahead_by": ahead_by,
            "status": status_str,
            "is_up_to_date": behind_by == 0
        }
    }


def sync_upstream_fork(repo_url: str, branch: str = None, token: str = None) -> Dict[str, Any]:
    """
    Triggers GitHub's fast-forward / merge-upstream endpoint:
    POST /repos/{owner}/{repo}/merge-upstream
    branch: the default branch of the fork to merge upstream into.
    """
    owner, repo = parse_github_url(repo_url)

    # Check fork info
    repo_data = github_client.get(f"/repos/{owner}/{repo}", token=token) or {}
    if not repo_data.get("fork"):
        return {
            "success": False,
            "error": f"Repository '{owner}/{repo}' is not a fork."
        }

    target_branch = branch or repo_data.get("default_branch", "main")

    payload = {
        "branch": target_branch
    }

    res = github_client.post(f"/repos/{owner}/{repo}/merge-upstream", data=payload, token=token)

    if res and ("message" in res or "merge_type" in res):
        return {
            "success": True,
            "branch": target_branch,
            "merge_type": res.get("merge_type", "fast-forward"),
            "message": res.get("message", "Fork successfully synchronized with upstream!")
        }

    return {
        "success": False,
        "branch": target_branch,
        "error": "Failed to synchronize with upstream. There may be unresolvable merge conflicts or missing write permissions."
    }
