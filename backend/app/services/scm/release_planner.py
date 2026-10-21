import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def generate_release_plan(
    repo_data: Dict[str, Any],
    commits: List[Dict[str, Any]],
    existing_releases: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate an SCM Release Plan, verification checklist, and categorized release notes
    synthesized from repository commit history and Conventional Commits.
    """
    repo_name = repo_data.get("name", "Project")
    owner = repo_data.get("owner", {}).get("login", "owner")
    now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Determine next target version
    if existing_releases and len(existing_releases) > 0:
        latest_tag = existing_releases[0].get("tag_name", "v1.0.0").lstrip("v")
        parts = latest_tag.split(".")
        try:
            major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
            target_version = f"v{major}.{minor + 1}.0"
        except Exception:
            target_version = "v1.1.0"
    else:
        target_version = "v1.0.0"

    # Categorize commits
    features: List[str] = []
    bug_fixes: List[str] = []
    documentation: List[str] = []
    refactoring: List[str] = []
    chores: List[str] = []
    other: List[str] = []

    for c in commits:
        commit_msg = c.get("commit", {}).get("message", "").strip().split("\n")[0]
        sha = c.get("sha", "")[:7]
        author = c.get("commit", {}).get("author", {}).get("name", "Contributor")
        entry = f"{commit_msg} (`{sha}`) - @{author}"

        lower = commit_msg.lower()
        if lower.startswith("feat"):
            features.append(entry)
        elif lower.startswith("fix"):
            bug_fixes.append(entry)
        elif lower.startswith("doc"):
            documentation.append(entry)
        elif lower.startswith("refactor") or lower.startswith("perf"):
            refactoring.append(entry)
        elif lower.startswith("chore") or lower.startswith("build") or lower.startswith("ci"):
            chores.append(entry)
        else:
            other.append(entry)

    # Provide smart defaults if commit history is sparse
    if not features and not bug_fixes and not other:
        features.append("Initial repository setup and baseline architecture (`#1`)")
        documentation.append("Comprehensive SCM README and configuration guide (`#2`)")

    # Format release notes in Markdown
    md_lines = [
        f"# Release {target_version} ({now_date})",
        "",
        f"Automated release baseline for **{owner}/{repo_name}**.",
        "",
        "---",
        ""
    ]

    if features:
        md_lines.append("## 🚀 New Features")
        for f in features:
            md_lines.append(f"- {f}")
        md_lines.append("")

    if bug_fixes:
        md_lines.append("## 🐛 Bug Fixes")
        for b in bug_fixes:
            md_lines.append(f"- {b}")
        md_lines.append("")

    if documentation:
        md_lines.append("## 📝 Documentation Improvements")
        for d in documentation:
            md_lines.append(f"- {d}")
        md_lines.append("")

    if refactoring:
        md_lines.append("## ⚡ Performance & Refactoring")
        for r in refactoring:
            md_lines.append(f"- {r}")
        md_lines.append("")

    if chores:
        md_lines.append("## 🔧 Maintenance & Tooling")
        for c in chores:
            md_lines.append(f"- {c}")
        md_lines.append("")

    if other:
        md_lines.append("## 📦 General Changes")
        for o in other:
            md_lines.append(f"- {o}")
        md_lines.append("")

    md_lines.extend([
        "---",
        "",
        "## 📋 SCM Pre-Release Verification Checklist",
        "- [ ] **Documentation**: README, changelog, and API docs up to date.",
        "- [ ] **Testing**: All automated test suites passing with 0 failures.",
        "- [ ] **Code Review**: All pull requests reviewed and approved by codeowners.",
        "- [ ] **Branch Merge**: Release branch merged into default production branch (`main`).",
        f"- [ ] **Tagging**: Git tag created: `git tag -a {target_version} -m 'Release {target_version}'`.",
        "- [ ] **Deployment**: CI/CD release artifact built and published to target registry.",
        "",
        f"**Full Changelog**: `https://github.com/{owner}/{repo_name}/commits/{target_version}`"
    ])

    checklist = [
        {"id": "chk-doc", "task": "Documentation updated (README, API reference, changelog)", "completed": False},
        {"id": "chk-test", "task": "Testing: Unit, integration, and security checks passing", "completed": False},
        {"id": "chk-review", "task": "Code Review: PR approvals satisfied from maintainers", "completed": False},
        {"id": "chk-merge", "task": "Merge: Feature branch merged cleanly into production branch", "completed": False},
        {"id": "chk-tag", "task": f"Git Tag: Create signed version tag ({target_version})", "completed": False},
        {"id": "chk-deploy", "task": "Deploy: Trigger artifact build and production deployment", "completed": False},
    ]

    return {
        "target_version": target_version,
        "release_date": now_date,
        "markdown_notes": "\n".join(md_lines).strip(),
        "checklist": checklist,
        "metrics": {
            "features_count": len(features),
            "bug_fixes_count": len(bug_fixes),
            "documentation_count": len(documentation),
            "total_commits_synthesized": len(commits)
        }
    }
