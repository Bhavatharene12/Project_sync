"""
Service for Today's Workspace triage queue.
Identifies pending PR reviews, broken CI workflows, mergeable PRs, and stale unmerged branches.
"""
from typing import Dict, Any, List
import logging
from datetime import datetime, timezone, timedelta
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.workspace")


def get_workspace_triage(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Scans the repository and returns actionable triage items for the developer's day:
    - Ready to merge PRs
    - Broken CI runs needing investigation
    - Pull Requests awaiting review / attention
    - Stale unmerged branches
    """
    owner, repo = parse_github_url(repo_url)

    # 1. Fetch Open Pull Requests safely
    pulls_raw = []
    try:
        pulls_raw = github_client.get(f"/repos/{owner}/{repo}/pulls?state=open&per_page=20", token=token, allow_404=True) or []
    except Exception as e:
        logger.debug(f"Pull requests unavailable: {e}")
    
    ready_to_merge: List[Dict[str, Any]] = []
    needs_review: List[Dict[str, Any]] = []
    
    for pr in pulls_raw:
        pr_number = pr.get("number")
        pr_title = pr.get("title")
        author = pr.get("user", {}).get("login", "unknown")
        created_at = pr.get("created_at")
        head_branch = pr.get("head", {}).get("ref")
        draft = pr.get("draft", False)
        
        # Check reviews if possible
        reviews = []
        try:
            reviews = github_client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}/reviews", token=token, allow_404=True) or []
        except Exception:
            reviews = []
        approved = any(r.get("state") == "APPROVED" for r in reviews)
        changes_requested = any(r.get("state") == "CHANGES_REQUESTED" for r in reviews)

        item = {
            "id": f"pr-{pr_number}",
            "number": pr_number,
            "title": pr_title,
            "author": author,
            "created_at": created_at,
            "branch": head_branch,
            "draft": draft,
            "url": pr.get("html_url"),
            "approved": approved,
            "changes_requested": changes_requested
        }

        if approved and not changes_requested and not draft:
            item["action"] = "Ready to Merge"
            item["action_type"] = "merge_pr"
            ready_to_merge.append(item)
        else:
            item["action"] = "Review Required" if not changes_requested else "Changes Requested"
            item["action_type"] = "review_pr"
            needs_review.append(item)

    # 2. Fetch Workflow / CI Runs safely
    broken_ci: List[Dict[str, Any]] = []
    try:
        runs_res = github_client.get(f"/repos/{owner}/{repo}/actions/runs?per_page=15", token=token, allow_404=True) or {}
        workflow_runs = runs_res.get("workflow_runs", [])
        for run in workflow_runs:
            conclusion = run.get("conclusion")
            status = run.get("status")
            if conclusion in ("failure", "timed_out"):
                broken_ci.append({
                    "id": f"ci-{run.get('id')}",
                    "run_id": run.get("id"),
                    "name": run.get("name"),
                    "event": run.get("event"),
                    "branch": run.get("head_branch"),
                    "commit_message": run.get("head_commit", {}).get("message", "").split("\n")[0],
                    "actor": run.get("actor", {}).get("login", "unknown"),
                    "url": run.get("html_url"),
                    "created_at": run.get("created_at"),
                    "conclusion": conclusion,
                    "action": "Investigate Failure",
                    "action_type": "rerun_ci"
                })
    except Exception as e:
        logger.debug(f"Action runs not available: {e}")

    # 3. Check Branches and Stale Unmerged Branches safely
    branches_raw = []
    try:
        branches_raw = github_client.get(f"/repos/{owner}/{repo}/branches?per_page=30", token=token, allow_404=True) or []
    except Exception as e:
        logger.debug(f"Branches not available: {e}")

    stale_branches: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)
    
    # Identify default branch and repo metadata safely
    repo_meta = {}
    try:
        repo_meta = github_client.get(f"/repos/{owner}/{repo}", token=token, allow_404=True) or {}
    except Exception:
        repo_meta = {}
    default_branch = repo_meta.get("default_branch", "main")

    for b in branches_raw:
        branch_name = b.get("name")
        if branch_name in [default_branch, "main", "master", "develop", "prod", "production"]:
            continue
        
        # Check commit date of branch head
        commit_sha = b.get("commit", {}).get("sha")
        if commit_sha:
            try:
                commit_data = github_client.get(f"/repos/{owner}/{repo}/commits/{commit_sha}", token=token, allow_404=True) or {}
                commit_date_str = commit_data.get("commit", {}).get("author", {}).get("date")
                if commit_date_str:
                    c_date = datetime.fromisoformat(commit_date_str.replace("Z", "+00:00"))
                    age_days = (now - c_date).days
                    if age_days >= 7:
                        stale_branches.append({
                            "id": f"branch-{branch_name}",
                            "name": branch_name,
                            "sha": commit_sha[:7],
                            "last_commit_date": commit_date_str,
                            "age_days": age_days,
                            "author": commit_data.get("commit", {}).get("author", {}).get("name", "Unknown"),
                            "action": "Prune Stale Branch",
                            "action_type": "delete_branch"
                        })
            except Exception as e:
                logger.debug(f"Date parse error for branch {branch_name}: {e}")

    # 4. Fetch Recent Commits for Activity & Health Baseline
    recent_commits: List[Dict[str, Any]] = []
    try:
        commits_res = github_client.get(f"/repos/{owner}/{repo}/commits?per_page=8", token=token, allow_404=True) or []
        for c in commits_res:
            c_msg = c.get("commit", {}).get("message", "").strip().split("\n")[0]
            c_author = c.get("author", {}).get("login") or c.get("commit", {}).get("author", {}).get("name", "Unknown")
            c_date = c.get("commit", {}).get("author", {}).get("date")
            recent_commits.append({
                "sha": c.get("sha", "")[:7],
                "message": c_msg,
                "author": c_author,
                "date": c_date,
                "url": c.get("html_url")
            })
    except Exception as e:
        logger.debug(f"Recent commits fetch error: {e}")

    # 5. Fetch Latest Release tag if present
    latest_release = None
    try:
        rel = github_client.get(f"/repos/{owner}/{repo}/releases/latest", token=token, allow_404=True)
        if rel and isinstance(rel, dict) and "tag_name" in rel:
            latest_release = {
                "tag_name": rel.get("tag_name"),
                "name": rel.get("name"),
                "published_at": rel.get("published_at"),
                "html_url": rel.get("html_url")
            }
    except Exception:
        latest_release = None

    total_actions = len(ready_to_merge) + len(broken_ci) + len(needs_review) + len(stale_branches)

    # Compute a quick health status
    health_indicator = "STABLE" if total_actions == 0 else "ATTENTION_NEEDED"

    return {
        "repository": f"{owner}/{repo}",
        "default_branch": default_branch,
        "scanned_at": now.isoformat(),
        "summary": {
            "total_action_items": total_actions,
            "ready_to_merge_count": len(ready_to_merge),
            "broken_ci_count": len(broken_ci),
            "needs_review_count": len(needs_review),
            "stale_branch_count": len(stale_branches),
            "health_indicator": health_indicator,
            "total_branches": len(branches_raw),
            "open_issues_count": repo_meta.get("open_issues_count", 0) if isinstance(repo_meta, dict) else 0,
        },
        "ready_to_merge": ready_to_merge,
        "broken_ci": broken_ci,
        "needs_review": needs_review,
        "stale_branches": stale_branches,
        "recent_commits": recent_commits,
        "latest_release": latest_release,
        "repo_meta": {
            "description": repo_meta.get("description", "No description provided.") if isinstance(repo_meta, dict) else "",
            "visibility": repo_meta.get("visibility", "public") if isinstance(repo_meta, dict) else "public",
            "html_url": repo_meta.get("html_url", f"https://github.com/{owner}/{repo}") if isinstance(repo_meta, dict) else ""
        }
    }
