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


def compute_scm_scoring(
    health_result: Dict[str, Any],
    readme_result: Dict[str, Any],
    branch_result: Dict[str, Any],
    branch_audit: Dict[str, Any],
    commit_audit: Dict[str, Any],
    release_audit: Dict[str, Any],
    workflow_audit: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Weighted SCM scoring formula:
    - Repository Health: 15%
    - Documentation (README): 20%
    - Branch Hygiene & Topology: 20%
    - Conventional Commits Compliance: 15%
    - Release & SemVer Management: 15%
    - CI/CD Workflow Automation: 15%

    Strict grade capping rule:
    Repositories with missing releases, failing/missing CI, stale branches,
    or poor documentation cannot receive A or A+ grades (strictly capped at B+ or lower).
    """
    health_score = int(health_result.get("score", 0))
    readme_score = int(readme_result.get("score", 0))
    branch_score = int(branch_result.get("score", 0))
    commit_score = int(round(commit_audit.get("conventional_commit_rate", 0.0)))

    total_releases = release_audit.get("total_releases", 0)
    semver_rate = release_audit.get("semver_compliance_rate", 0.0)
    if total_releases > 0:
        release_score = int(round(max(semver_rate, 60.0)))
    elif release_audit.get("total_tags", 0) > 0:
        release_score = 50
    else:
        release_score = 20

    total_workflows = workflow_audit.get("total_workflows", 0)
    ci_pass_rate = workflow_audit.get("ci_pass_rate", 0.0)
    if total_workflows > 0:
        inspected_runs = workflow_audit.get("recent_runs_inspected", 0)
        workflow_score = int(round(ci_pass_rate if inspected_runs > 0 else 85.0))
    else:
        workflow_score = 20

    raw_score = round(
        (health_score * 0.15) +
        (readme_score * 0.20) +
        (branch_score * 0.20) +
        (commit_score * 0.15) +
        (release_score * 0.15) +
        (workflow_score * 0.15)
    )

    cap_reasons = []
    if total_releases == 0:
        cap_reasons.append("Missing formal GitHub releases")
    if total_workflows == 0:
        cap_reasons.append("Missing CI/CD workflow automation")
    elif workflow_audit.get("recent_runs_inspected", 0) > 0 and ci_pass_rate < 70:
        cap_reasons.append(f"Failing CI pipeline runs ({ci_pass_rate}% pass rate)")

    stale_branches = branch_audit.get("stale_branches", 0)
    total_branches = branch_result.get("total_branches", 0)
    if stale_branches > 0:
        cap_reasons.append(f"{stale_branches} stale/unmerged branch(es) detected")
    elif total_branches <= 1:
        cap_reasons.append("No active feature branches isolating main")

    if readme_score < 70:
        cap_reasons.append("Substandard README documentation (missing required sections)")

    # Standard grade scale
    if raw_score >= 95:
        initial_grade = "A+"
    elif raw_score >= 89:
        initial_grade = "A"
    elif raw_score >= 80:
        initial_grade = "B+"
    elif raw_score >= 70:
        initial_grade = "B"
    elif raw_score >= 60:
        initial_grade = "C+"
    elif raw_score >= 50:
        initial_grade = "C"
    else:
        initial_grade = "D"

    # Enforce capping: if any cap reason exists and grade is A or A+, cap to B+ (and score <= 88)
    final_grade = initial_grade
    final_score = raw_score
    is_capped = False

    if cap_reasons and initial_grade in ("A+", "A"):
        is_capped = True
        final_grade = "B+"
        final_score = min(raw_score, 88)

    return {
        "overall_score": final_score,
        "raw_score": raw_score,
        "grade": final_grade,
        "initial_grade": initial_grade,
        "is_capped": is_capped,
        "cap_reasons": cap_reasons,
        "dimension_scores": {
            "health": health_score,
            "documentation": readme_score,
            "branches": branch_score,
            "commits": commit_score,
            "releases": release_score,
            "workflows": workflow_score
        }
    }


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
    scoring = compute_scm_scoring(
        health_result=health_result,
        readme_result=readme_result,
        branch_result=branch_result,
        branch_audit=branch_audit,
        commit_audit=commit_audit,
        release_audit=release_audit,
        workflow_audit=workflow_audit
    )

    report = SCMReport(
        repository=repo_meta.get("name", repo_name),
        owner=repo_meta.get("owner", {}).get("login", owner),
        generated_at=now_iso,
        health_grade=scoring["grade"],
        summary=f"SCM overall score: {scoring['overall_score']}% (Grade: {scoring['grade']}). {len(problems)} problem(s) identified with {len(recommendations)} recommendation(s).",
        overall_score=scoring["overall_score"],
        grade=scoring["grade"],
        grade_capped=scoring["is_capped"],
        cap_reasons=scoring["cap_reasons"],
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
        "scm_score": scoring["overall_score"],
        "grade": scoring["grade"],
        "scoring": scoring,
        "metrics": {
            "recent_commits_count": len(commits),
            "open_pull_requests_count": len(pull_requests),
            "releases_count": len(releases),
            "tags_count": len(tags),
            "workflows_count": len(workflows),
            "contributors_count": len(contributors)
        }
    }

