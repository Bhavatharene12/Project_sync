"""
Service for Project Review Generator.
Produces comprehensive academic & team SCM evaluation reports (PROJECT_SCM_REPORT.md)
with contributor metrics, branch hygiene, commit quality, and 1-click commit to repo.
"""
from typing import Dict, Any, List
from collections import defaultdict
import base64
import logging
from datetime import datetime, timezone
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.project_review")


def generate_project_review(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Analyzes repository history and builds an evaluation report for academic/team submission.
    """
    owner, repo = parse_github_url(repo_url)

    # 1. Fetch Repository Details
    repo_data = github_client.get(f"/repos/{owner}/{repo}", token=token) or {}
    default_branch = repo_data.get("default_branch", "main")

    # 2. Fetch Contributors & Commit Distribution
    commits = github_client.get(f"/repos/{owner}/{repo}/commits?per_page=100", token=token) or []
    total_commits = len(commits)

    contributor_stats = defaultdict(lambda: {"count": 0, "conventional_count": 0, "messages": []})
    conventional_types = {"feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"}

    for c in commits:
        author = c.get("author", {}).get("login") or c.get("commit", {}).get("author", {}).get("name", "Unknown")
        msg = c.get("commit", {}).get("message", "").strip().split("\n")[0]
        
        contributor_stats[author]["count"] += 1
        contributor_stats[author]["messages"].append(msg)

        # Check conventional commit format
        prefix = msg.split(":")[0].split("(")[0].lower().strip()
        if prefix in conventional_types:
            contributor_stats[author]["conventional_count"] += 1

    contributors_list = []
    for author, stat in contributor_stats.items():
        pct = round((stat["count"] / max(total_commits, 1)) * 100, 1)
        conv_pct = round((stat["conventional_count"] / max(stat["count"], 1)) * 100, 1)
        contributors_list.append({
            "author": author,
            "commits": stat["count"],
            "share_percent": pct,
            "conventional_commit_rate": f"{conv_pct}%",
            "recent_sample": stat["messages"][:3]
        })
    contributors_list.sort(key=lambda x: x["commits"], reverse=True)

    # 3. Pull Requests & Reviews
    prs = github_client.get(f"/repos/{owner}/{repo}/pulls?state=all&per_page=30", token=token) or []
    merged_prs = sum(1 for pr in prs if pr.get("merged_at"))

    # 4. Releases / Tags
    releases = github_client.get(f"/repos/{owner}/{repo}/releases?per_page=10", token=token) or []
    tags = github_client.get(f"/repos/{owner}/{repo}/tags?per_page=10", token=token) or []

    # 5. Check Essential Files
    has_license = bool(github_client.get(f"/repos/{owner}/{repo}/contents/LICENSE", token=token))
    has_gitignore = bool(github_client.get(f"/repos/{owner}/{repo}/contents/.gitignore", token=token))
    has_ci = bool(github_client.get(f"/repos/{owner}/{repo}/contents/.github/workflows", token=token))

    # Calculate overall SCM Compliance Grade
    checks_passed = sum([
        total_commits >= 10,
        len(contributors_list) >= 1,
        len(prs) >= 1,
        has_license,
        has_gitignore,
        has_ci,
        len(tags) >= 1 or len(releases) >= 1
    ])
    
    grade = "A" if checks_passed >= 6 else "B" if checks_passed >= 4 else "C" if checks_passed >= 2 else "Incomplete"

    # Build Markdown Report
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    report_md = f"""# SCM Academic & Team Project Evaluation Report

- **Repository**: `{owner}/{repo}`
- **Evaluation Date**: {generated_at}
- **Default Branch**: `{default_branch}`
- **Overall SCM Grade**: **{grade}** ({checks_passed}/7 Criteria Met)

---

## 👥 1. Contributor Work Distribution
| Contributor | Commits | Contribution Share | Conventional Commit Adherence |
| :--- | :--- | :--- | :--- |
"""
    for c in contributors_list:
        report_md += f"| **@{c['author']}** | {c['commits']} | {c['share_percent']}% | {c['conventional_commit_rate']} |\n"

    report_md += f"""
---

## 🌿 2. Branching & Pull Request Discipline
- **Total Pull Requests Tracked**: {len(prs)}
- **Merged PRs**: {merged_prs}
- **PR Usage**: {"Disciplined (Features merged via PR)" if len(prs) > 0 else "Direct pushes to main branch detected (recommend branch protection)"}

---

## 📦 3. Release & Tag Management
- **Official Releases**: {len(releases)}
- **Git Tags**: {len(tags)}
- **Versioning Strategy**: {"Present" if len(releases) > 0 or len(tags) > 0 else "No release tags found (recommend Semantic Versioning, e.g. v1.0.0)"}

---

## 🛡️ 4. SCM Essentials Checklist
- [{'x' if has_gitignore else ' '}] `.gitignore` configured to prevent committing binaries and secrets
- [{'x' if has_license else ' '}] Open-Source License established
- [{'x' if has_ci else ' '}] CI/CD Automation Workflow configured (.github/workflows)
- [{'x' if len(prs) > 0 else ' '}] Code review / Pull Request workflow applied
- [{'x' if len(tags) > 0 else ' '}] Version tagging discipline applied

---
*Generated by Sync – AI Software Configuration Management Assistant*
"""

    return {
        "repository": f"{owner}/{repo}",
        "grade": grade,
        "score_criteria_met": f"{checks_passed}/7",
        "total_commits": total_commits,
        "contributors": contributors_list,
        "pull_requests": {
            "total": len(prs),
            "merged": merged_prs
        },
        "releases_count": len(releases),
        "tags_count": len(tags),
        "checklist": {
            "gitignore": has_gitignore,
            "license": has_license,
            "ci_cd": has_ci,
            "pull_requests": len(prs) > 0,
            "version_tags": len(tags) > 0
        },
        "report_markdown": report_md
    }


def commit_report_to_repo(
    repo_url: str,
    content: str,
    path: str = "PROJECT_SCM_REPORT.md",
    token: str = None
) -> Dict[str, Any]:
    """
    Directly commits the generated report markdown into the repository root.
    """
    owner, repo = parse_github_url(repo_url)
    encoded = base64.b64encode(content.encode("utf-8")).decode("utf-8")

    # Fetch existing SHA if file exists
    existing = github_client.get(f"/repos/{owner}/{repo}/contents/{path}", token=token)
    payload = {
        "message": "docs(scm): add academic project evaluation report via Sync Assistant",
        "content": encoded
    }
    if existing and isinstance(existing, dict) and "sha" in existing:
        payload["sha"] = existing["sha"]

    res = github_client.put(f"/repos/{owner}/{repo}/contents/{path}", data=payload, token=token)
    if res and "content" in res:
        return {
            "success": True,
            "path": path,
            "commit_sha": res.get("commit", {}).get("sha", "")[:7],
            "message": f"Successfully published {path} to repository"
        }
    return {
        "success": False,
        "error": "Failed to commit project report to repository. Check token permissions."
    }
