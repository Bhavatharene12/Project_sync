"""
Service for Team Change Log.
Provides plain-English digest of teammate commits, overlap detection, and standup summary.
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import logging
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.teamsync")


def _categorize_commit(message: str) -> str:
    msg = message.lower().strip()
    if msg.startswith("feat") or "add" in msg or "feature" in msg or "implement" in msg:
        return "✨ Feature"
    if msg.startswith("fix") or "bug" in msg or "resolve" in msg or "patch" in msg:
        return "🐛 Bug Fix"
    if msg.startswith("docs") or "readme" in msg or "doc" in msg:
        return "📖 Documentation"
    if msg.startswith("test") or "spec" in msg:
        return "🧪 Testing"
    if msg.startswith("ci") or "workflow" in msg or "action" in msg:
        return "⚙️ CI / Automation"
    if msg.startswith("refactor") or "clean" in msg or "restructure" in msg:
        return "♻️ Refactoring"
    return "🔧 Maintenance"


def get_team_change_log(repo_url: str, hours: int = 72, token: str = None) -> Dict[str, Any]:
    """
    Retrieves and summarizes team activity for the past `hours` (default 72h).
    """
    owner, repo = parse_github_url(repo_url)
    
    since_dt = datetime.now(timezone.utc) - timedelta(hours=hours)
    since_iso = since_dt.isoformat()

    commits_raw = github_client.get(
        f"/repos/{owner}/{repo}/commits?since={since_iso}&per_page=50",
        token=token
    ) or []

    # If repository has low recent activity in 72h, fallback to latest 20 commits
    if len(commits_raw) < 5:
        commits_raw = github_client.get(
            f"/repos/{owner}/{repo}/commits?per_page=20",
            token=token
        ) or []

    contributors = defaultdict(list)
    file_touch_map = defaultdict(set)
    category_counts = defaultdict(int)

    for item in commits_raw:
        commit_obj = item.get("commit", {})
        sha = item.get("sha", "")[:7]
        author_name = commit_obj.get("author", {}).get("name", "Unknown")
        author_login = item.get("author", {}).get("login") if item.get("author") else author_name
        message = commit_obj.get("message", "").strip().split("\n")[0]
        date = commit_obj.get("author", {}).get("date")
        category = _categorize_commit(message)
        category_counts[category] += 1

        commit_record = {
            "sha": sha,
            "message": message,
            "category": category,
            "date": date,
            "url": item.get("html_url"),
            "author": author_login
        }
        contributors[author_login].append(commit_record)

    # Teammate summaries
    teammates = []
    for author, commits in contributors.items():
        teammates.append({
            "author": author,
            "commit_count": len(commits),
            "commits": commits[:10],
            "primary_focus": commits[0]["category"] if commits else "None"
        })

    # Sort teammates by commit volume
    teammates.sort(key=lambda x: x["commit_count"], reverse=True)

    # Standup summary text generator
    standup_lines = [
        f"### 🚀 Team Standup Digest — {owner}/{repo}",
        f"**Window**: Recent updates ({len(commits_raw)} commits tracked)",
        ""
    ]
    for tm in teammates:
        standup_lines.append(f"**@{tm['author']}** ({tm['commit_count']} commits):")
        for c in tm["commits"][:4]:
            standup_lines.append(f"- {c['category']}: {c['message']} (`{c['sha']}`)")
        standup_lines.append("")

    standup_markdown = "\n".join(standup_lines)

    return {
        "repository": f"{owner}/{repo}",
        "time_window_hours": hours,
        "total_commits": len(commits_raw),
        "active_members_count": len(teammates),
        "teammates": teammates,
        "category_breakdown": dict(category_counts),
        "standup_markdown": standup_markdown
    }
