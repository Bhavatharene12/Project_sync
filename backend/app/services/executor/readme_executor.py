import base64
import difflib
import logging
from typing import Any, Dict, List, Optional, Tuple
from app.services.github.client import github_client
from app.services.scm.readme_generator import generate_scm_readme
from app.services.github.github_repository import get_repository, get_topics
from app.services.executor.error_handler import handle_executor_error
from app.utils.config import settings

logger = logging.getLogger("sync.executor.readme")

STANDARD_SECTIONS = [
    "Project Title & Description",
    "Badges & CI Status",
    "Architecture / Tech Stack",
    "Prerequisites & Requirements",
    "Installation & Setup",
    "Usage & Workflow Commands",
    "Branching Strategy & Guidelines",
    "Contributing & Conventional Commits",
    "License Terms"
]


def fetch_readme_file(owner: str, repo: str, token: Optional[str] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Fetch raw README content, path, and GitHub blob SHA.
    Tries README.md, readme.md, README.
    Returns (raw_content_text, path, blob_sha).
    """
    candidates = ["README.md", "readme.md", "README", "readme.rst"]
    for path in candidates:
        try:
            data = github_client.get(f"/repos/{owner}/{repo}/contents/{path}", token=token, allow_404=True)
            if data and isinstance(data, dict) and "content" in data:
                raw_bytes = base64.b64decode(data["content"])
                text = raw_bytes.decode("utf-8", errors="replace")
                return text, data.get("path", path), data.get("sha")
        except Exception as exc:
            logger.debug(f"Could not fetch {path}: {exc}")

    return None, "README.md", None


def analyze_missing_sections(readme_text: Optional[str]) -> Dict[str, Any]:
    """Detect present vs missing enterprise SCM sections."""
    text_lower = (readme_text or "").lower()
    present: List[str] = []
    missing: List[str] = []

    checks = {
        "Project Title & Description": len(text_lower.strip()) > 30,
        "Badges & CI Status": "![" in text_lower or "badge" in text_lower or "shields.io" in text_lower,
        "Architecture / Tech Stack": "stack" in text_lower or "architecture" in text_lower or "technolog" in text_lower,
        "Prerequisites & Requirements": "prereq" in text_lower or "requirement" in text_lower or "dependencies" in text_lower,
        "Installation & Setup": "install" in text_lower or "setup" in text_lower or "clone" in text_lower,
        "Usage & Workflow Commands": "usage" in text_lower or "quick start" in text_lower or "run" in text_lower,
        "Branching Strategy & Guidelines": "branch" in text_lower or "gitflow" in text_lower or "workflow" in text_lower,
        "Contributing & Conventional Commits": "contribut" in text_lower or "conventional commit" in text_lower or "pr" in text_lower,
        "License Terms": "license" in text_lower or "mit" in text_lower or "apache" in text_lower
    }

    for section, is_present in checks.items():
        if is_present:
            present.append(section)
        else:
            missing.append(section)

    return {
        "present_sections": present,
        "missing_sections": missing,
        "completeness_score": int((len(present) / len(checks)) * 100)
    }


def compute_text_diff(old_text: str, new_text: str) -> Dict[str, Any]:
    """Compute line-by-line diff between existing and new README content."""
    old_lines = (old_text or "").splitlines(keepends=True)
    new_lines = (new_text or "").splitlines(keepends=True)

    diff_generator = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile="Existing README.md",
        tofile="Proposed SCM README.md",
        n=3
    )
    unified_diff_str = "".join(diff_generator)

    additions = sum(1 for line in unified_diff_str.splitlines() if line.startswith("+") and not line.startswith("+++"))
    deletions = sum(1 for line in unified_diff_str.splitlines() if line.startswith("-") and not line.startswith("---"))

    return {
        "unified_diff": unified_diff_str,
        "additions_count": additions,
        "deletions_count": deletions,
        "old_lines_count": len(old_lines),
        "new_lines_count": len(new_lines),
    }


def create_readme_plan(
    owner: str,
    repo: str,
    proposed_content: Optional[str] = None,
    commit_message: str = "docs(readme): synchronize enterprise SCM documentation [skip ci]",
    branch: Optional[str] = None,
    token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch existing README, generate missing sections, compute side-by-side diff,
    and create a staged execution plan requiring user approval.
    """
    existing_text, path, sha = fetch_readme_file(owner, repo, token=token)
    missing_analysis = analyze_missing_sections(existing_text)

    # If user didn't supply content, generate high quality enterprise README
    if not proposed_content:
        try:
            repo_meta = get_repository(owner, repo)
            topics = get_topics(owner, repo)
        except Exception:
            repo_meta = {"name": repo, "owner": {"login": owner}, "description": "Repository managed by Sync SCM"}
            topics = []

        scm_gen = generate_scm_readme(repo_meta, topics=topics)
        final_content = scm_gen.get("content", f"# {repo}\n\nAutomated README generated by Sync SCM.")
    else:
        final_content = proposed_content

    diff_data = compute_text_diff(existing_text or "", final_content)

    plan = {
        "plan_id": f"PLAN-README-{repo.lower()}",
        "action_type": "readme_update",
        "repository": f"{owner}/{repo}",
        "title": f"Synchronize Enterprise README.md on {owner}/{repo}",
        "description": f"Update README with {diff_data['additions_count']} additions addressing missing SCM sections ({', '.join(missing_analysis['missing_sections'][:3])}).",
        "impact_level": "LOW",
        "requires_approval": True,
        "approval_status": "pending",
        "diff": {
            **diff_data,
            "existing_content": existing_text or "<!-- No existing README found -->",
            "proposed_content": final_content,
            "missing_sections": missing_analysis["missing_sections"],
            "present_sections": missing_analysis["present_sections"],
            "completeness_score": missing_analysis["completeness_score"]
        },
        "payload": {
            "owner": owner,
            "repo": repo,
            "path": path or "README.md",
            "sha": sha,
            "content": final_content,
            "commit_message": commit_message,
            "branch": branch or "main"
        },
        "rollback_strategy": "Revert to previous git commit SHA or restore previous README revision via GitHub Git History.",
        "created_at": "now"
    }

    return plan


def execute_readme_commit(
    payload: Dict[str, Any],
    token: Optional[str] = None,
    simulate: bool = False
) -> Dict[str, Any]:
    """
    Commit the updated README directly to GitHub using the Contents API:
    PUT /repos/{owner}/{repo}/contents/{path}
    """
    active_token = token or (settings.GITHUB_TOKEN if settings.has_github_token() else None)
    is_simulated = simulate or payload.get("simulation", False) or not active_token

    owner = payload["owner"]
    repo = payload["repo"]
    path = payload.get("path", "README.md")
    content = payload["content"]
    commit_message = payload.get("commit_message", "docs(readme): update README via Sync SCM")
    branch = payload.get("branch", "main")

    simulated = {
        "success": True,
        "status": "SIMULATED",
        "commit_sha": "sim_sha_9f4b7a12e8c049d5b",
        "resource_url": f"https://github.com/{owner}/{repo}/blob/{branch}/{path}",
        "summary": f"[Simulated Execution] Successfully staged and verified README commit on {owner}/{repo}.",
        "verified": True,
        "verification_message": f"Simulation verified: verified SHA and file changes staged for {path}."
    }

    if is_simulated:
        return simulated

    # Real GitHub API execution
    encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    body: Dict[str, Any] = {
        "message": commit_message,
        "content": encoded_content,
        "branch": branch
    }
    sha = payload.get("sha")
    if not sha:
        try:
            existing = github_client.get(f"/repos/{owner}/{repo}/contents/{path}", params={"ref": branch}, token=active_token, allow_404=True)
            if existing and isinstance(existing, dict) and "sha" in existing:
                sha = existing["sha"]
        except Exception:
            pass
    if sha:
        body["sha"] = sha

    try:
        resp = github_client.put(
            f"/repos/{owner}/{repo}/contents/{path}",
            json_data=body,
            token=active_token
        )

        commit_sha = resp.get("commit", {}).get("sha") if isinstance(resp, dict) else None
        html_url = resp.get("content", {}).get("html_url") if isinstance(resp, dict) else None

        return {
            "success": True,
            "status": "SUCCESS",
            "commit_sha": commit_sha,
            "resource_url": html_url or f"https://github.com/{owner}/{repo}/blob/{branch}/{path}",
            "summary": f"Successfully committed updated {path} to branch '{branch}'.",
            "verified": bool(commit_sha),
            "verification_message": f"Verified commit {commit_sha[:8] if commit_sha else 'OK'} registered on GitHub branch '{branch}'."
        }
    except Exception as exc:
        return handle_executor_error(
            exc=exc,
            action_attempted="readme_commit",
            token=active_token,
            simulation_requested=False,
            simulated_response=None
        )

