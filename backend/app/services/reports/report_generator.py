from typing import Any, Dict


def generate_markdown_report(scm_analysis: Dict[str, Any]) -> str:
    """
    Generate a detailed GitHub-flavored Markdown audit report for SCM activities.
    """
    meta = scm_analysis.get("metadata", {})
    health = scm_analysis.get("health", {})
    readme = scm_analysis.get("readme", {})
    branches = scm_analysis.get("branches", {})
    commit_audit = scm_analysis.get("commits_audit", {})
    release_audit = scm_analysis.get("release_audit", {})
    workflow_audit = scm_analysis.get("workflow_audit", {})
    report_data = scm_analysis.get("report", {})
    problems = report_data.get("problems", [])
    recommendations = report_data.get("recommendations", [])
    tasks = report_data.get("available_tasks", [])

    repo_name = meta.get("name", "Unknown Repository")
    owner = meta.get("owner", {}).get("login", "Unknown")

    lines = [
        f"# Sync AI SCM Audit Report: `{owner}/{repo_name}`",
        "",
        f"**Generated:** {report_data.get('generated_at', 'N/A')}  ",
        f"**Health Assessment:** `{report_data.get('health_grade', 'N/A')}` ({health.get('score', 0)}%)  ",
        f"**Primary Language:** {meta.get('language', 'N/A')}  ",
        f"**Default Branch:** `{meta.get('default_branch', 'main')}`",
        "",
        "---",
        "",
        "## 1. Executive Summary",
        report_data.get("summary", "No summary available."),
        "",
        "| SCM Dimension | Score / Status | Assessment |",
        "| :--- | :--- | :--- |",
        f"| Repository Health | {health.get('score', 0)}% | {health.get('health', 'N/A')} |",
        f"| Documentation (README) | {readme.get('score', 0)}% | {readme.get('status', 'N/A')} |",
        f"| Branch Hygiene | {branches.get('score', 0)}% | {branches.get('status', 'N/A')} ({branches.get('total_branches', 0)} branches) |",
        f"| Commit Conventions | {commit_audit.get('conventional_commit_rate', 0)}% | {commit_audit.get('status', 'N/A')} |",
        f"| Release Baselines | {release_audit.get('semver_compliance_rate', 0)}% | {release_audit.get('status', 'N/A')} ({release_audit.get('total_releases', 0)} releases) |",
        f"| CI/CD Automation | {workflow_audit.get('ci_pass_rate', 0)}% | {workflow_audit.get('status', 'N/A')} ({workflow_audit.get('total_workflows', 0)} workflows) |",
        "",
        "---",
        "",
        "## 2. Identified SCM Problems",
    ]

    if not problems:
        lines.append("No critical SCM problems detected! Great repository hygiene.")
    else:
        for p in problems:
            severity_badge = f"**[{p.get('severity', 'info').upper()}]**"
            lines.append(f"### {severity_badge} {p.get('title')}")
            lines.append(f"- **Category:** `{p.get('category')}`")
            lines.append(f"- **Description:** {p.get('description')}")
            lines.append("")

    lines.extend([
        "---",
        "",
        "## 3. Recommended SCM Fixes",
    ])

    if not recommendations:
        lines.append("No pending recommendations.")
    else:
        for r in recommendations:
            auto_badge = "⚡ *Automated Task Available*" if r.get("automated") else "🛠️ *Manual Action*"
            lines.append(f"### {r.get('title')} ({auto_badge})")
            lines.append(f"- **Action:** {r.get('action')}")
            lines.append(f"- **Rationale:** {r.get('rationale')}")
            lines.append("")

    lines.extend([
        "---",
        "",
        "## 4. Pending Approval Tasks",
    ])

    if not tasks:
        lines.append("No pending automated tasks.")
    else:
        for t in tasks:
            lines.append(f"- [ ] **{t.get('name')}** (`{t.get('task_type')}`): {t.get('description')}")

    lines.append("")
    return "\n".join(lines)
