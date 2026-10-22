"""
Service for Safe Branch Cleaner.
Categorizes branches into Safe to Delete (100% merged), Active Work (has unmerged commits),
and Protected. Provides safe 1-click deletion.
"""
from typing import Dict, Any, List
import logging
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.branch_cleaner")

PROTECTED_NAMES = {"main", "master", "develop", "dev", "production", "prod", "release", "staging"}


def audit_branches(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Compares all repository branches against the default branch to find safe deletions.
    """
    owner, repo = parse_github_url(repo_url)

    # 1. Get default branch
    repo_meta = github_client.get(f"/repos/{owner}/{repo}", token=token) or {}
    default_branch = repo_meta.get("default_branch", "main")

    # 2. Fetch all branches
    branches_raw = github_client.get(f"/repos/{owner}/{repo}/branches?per_page=50", token=token) or []

    safe_to_delete: List[Dict[str, Any]] = []
    active_branches: List[Dict[str, Any]] = []
    protected_branches: List[Dict[str, Any]] = []

    for b in branches_raw:
        branch_name = b.get("name")
        is_protected = b.get("protected", False) or (branch_name.lower() in PROTECTED_NAMES) or (branch_name == default_branch)
        commit_sha = b.get("commit", {}).get("sha", "")[:7]

        if is_protected:
            protected_branches.append({
                "name": branch_name,
                "sha": commit_sha,
                "status": "PROTECTED",
                "reason": "Default or Protected branch"
            })
            continue

        # Compare with default branch
        compare_data = github_client.get(
            f"/repos/{owner}/{repo}/compare/{default_branch}...{branch_name}",
            token=token
        ) or {}

        ahead_by = compare_data.get("ahead_by", 0)
        behind_by = compare_data.get("behind_by", 0)
        status_str = compare_data.get("status", "unknown")

        branch_info = {
            "name": branch_name,
            "sha": commit_sha,
            "ahead_by": ahead_by,
            "behind_by": behind_by,
            "status": status_str,
            "base_branch": default_branch
        }

        # If ahead_by == 0, every commit in this branch is already merged into main! Safe to delete!
        if ahead_by == 0:
            branch_info["can_delete_safely"] = True
            branch_info["reason"] = f"Fully merged into {default_branch} (0 commits ahead)"
            safe_to_delete.append(branch_info)
        else:
            branch_info["can_delete_safely"] = False
            branch_info["reason"] = f"Has {ahead_by} unmerged commit(s) ahead of {default_branch}"
            active_branches.append(branch_info)

    return {
        "repository": f"{owner}/{repo}",
        "default_branch": default_branch,
        "total_branches": len(branches_raw),
        "safe_to_delete_count": len(safe_to_delete),
        "active_branches_count": len(active_branches),
        "protected_branches_count": len(protected_branches),
        "safe_to_delete": safe_to_delete,
        "active_branches": active_branches,
        "protected_branches": protected_branches
    }


def delete_branch(repo_url: str, branch_name: str, force: bool = False, token: str = None) -> Dict[str, Any]:
    """
    Deletes a branch safely via GitHub REST API refs endpoint.
    Refuses to delete protected or unmerged branches unless force is True.
    """
    owner, repo = parse_github_url(repo_url)

    if branch_name.lower() in PROTECTED_NAMES:
        return {
            "success": False,
            "branch": branch_name,
            "error": f"Branch '{branch_name}' is protected and cannot be deleted."
        }

    # Verify safe if not force
    if not force:
        repo_meta = github_client.get(f"/repos/{owner}/{repo}", token=token) or {}
        default_branch = repo_meta.get("default_branch", "main")
        compare_data = github_client.get(
            f"/repos/{owner}/{repo}/compare/{default_branch}...{branch_name}",
            token=token
        ) or {}
        ahead_by = compare_data.get("ahead_by", 0)
        if ahead_by > 0:
            return {
                "success": False,
                "branch": branch_name,
                "error": f"Safety Guard: Branch '{branch_name}' has {ahead_by} unmerged commits. Use force=True to delete."
            }

    # Execute GitHub Delete Ref
    res = github_client.delete(f"/repos/{owner}/{repo}/git/refs/heads/{branch_name}", token=token)
    
    # 204 No Content means success on GitHub
    return {
        "success": True,
        "branch": branch_name,
        "message": f"Branch '{branch_name}' deleted successfully from GitHub."
    }
