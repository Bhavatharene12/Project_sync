from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.models.scm import SCMReport
from app.services.github import (
    get_repository,
    get_readme,
    get_branches,
    get_commits,
    get_pull_requests,
    get_releases,
    get_workflows,
    get_workflow_runs,
    get_tags,
    get_contributors,
)
from app.services.ai.ai_analyzer import calculate_health
from app.services.ai.readme_analyzer import analyze_readme
from app.services.ai.scm_recommender import generate_scm_recommendations
from app.services.scm.branch_analyzer import analyze_branches, audit_branch_hygiene
from app.services.scm.commit_auditor import audit_commits
from app.services.scm.release_manager import audit_releases
from app.services.scm.workflow_auditor import audit_workflows


def run_full_scm_analysis(owner: str, repo_name: str) -> Dict[str, Any]:
    """
    Execute end-to-end SCM audit pipeline:
    1. Fetch repository, README, branches, commits, PRs, releases, tags, workflows, contributors
    2. Analyze SCM activities across each dimension
    3. Detect problems and deviations from best practices
    4. Generate actionable SCM recommendations and approval-ready tasks
    """
    # 1. Fetch Repository Artifacts
    repo_meta = get_repository(owner, repo_name)
    readme_text = get_readme(owner, repo_name)
    branches = get_branches(owner, repo_name)
    commits = get_commits(owner, repo_name, per_page=30)
    pull_requests = get_pull_requests(owner, repo_name, state="open", per_page=30)
    releases = get_releases(owner, repo_name, per_page=20)
    tags = get_tags(owner, repo_name, per_page=20)
    workflows = get_workflows(owner, repo_name)
    workflow_runs = get_workflow_runs(owner, repo_name, per_page=20)
    contributors = get_contributors(owner, repo_name, per_page=30)

    default_branch = repo_meta.get("default_branch", "main")

    # 2. Activity Analysis
    health_result = calculate_health(repo_meta)
    readme_result = analyze_readme(readme_text or "")
    branch_result = analyze_branches(branches, default_branch)
    branch_audit = audit_branch_hygiene(branches, default_branch)
    commit_audit = audit_commits(commits)
    release_audit = audit_releases(releases, tags)
    workflow_audit = audit_workflows(workflows, workflow_runs)

    # 3. Problem Detection & Recommendation Generation
    problems, recommendations, tasks = generate_scm_recommendations(
        repo_data=repo_meta,
        readme_result=readme_result,
        branch_result=branch_result,
        commits=commits,
        pull_requests=pull_requests,
        releases=releases,
        workflows=workflows,
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    health_grade = health_result.get("health", "Needs Attention")

    report = SCMReport(
        repository=repo_meta.get("name", repo_name),
        owner=repo_meta.get("owner", {}).get("login", owner),
        generated_at=now_iso,
        health_grade=health_grade,
        summary=f"SCM health assessed as {health_grade}. {len(problems)} problem(s) identified with {len(recommendations)} recommendation(s).",
        problems=problems,
        recommendations=recommendations,
        available_tasks=tasks
    )

    return {
        "report": report.model_dump(),
        "metadata": repo_meta,
        "health": health_result,
        "readme": readme_result,
        "branches": branch_result,
        "branch_audit": branch_audit,
        "commits_audit": commit_audit,
        "release_audit": release_audit,
        "workflow_audit": workflow_audit,
        "metrics": {
            "recent_commits_count": len(commits),
            "open_pull_requests_count": len(pull_requests),
            "releases_count": len(releases),
            "tags_count": len(tags),
            "workflows_count": len(workflows),
            "contributors_count": len(contributors)
        }
    }
