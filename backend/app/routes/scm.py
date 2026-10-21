from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from app.models.repository import RepositoryRequest
from app.utils.url_parser import parse_github_url
from app.services.scm.scm_engine import run_full_scm_analysis
from app.services.reports.report_generator import generate_markdown_report
from app.services.github import (
    get_repository,
    get_readme,
    get_branches,
    get_commits,
    get_pull_requests,
    get_releases,
    get_workflows,
    get_topics,
)
from app.services.scm import (
    generate_scm_readme,
    generate_branching_strategy,
    generate_release_plan,
    analyze_and_rewrite_commits,
    generate_ci_workflow,
    analyze_change_impact,
)

router = APIRouter(prefix="/scm", tags=["SCM Assistant"])


@router.get("/status")
def scm_status():
    """Return status and active capabilities of the AI SCM Assistant."""
    return {
        "assistant": "Sync AI SCM Assistant",
        "version": "2.5.0",
        "capabilities": [
            "Repository Health Scoring",
            "Interactive SCM Action Center (/automation)",
            "Enterprise README Generator with Language Scaffolding",
            "SCM Branching Strategy & Lifecycle Model Generator",
            "Release Planning & Conventional Changelog Synthesizer",
            "Commit Message Rewriter & Conventional Commits Guide",
            "Language-Specific GitHub Actions Workflow Generator",
            "Change Impact Analysis & Merge Conflict Risk Estimator",
            "Smart Dynamic SCM Checklist Engine",
            "Multi-format Markdown & JSON Report Export"
        ]
    }


@router.post("/audit")
def audit_repository_scm(request: RepositoryRequest):
    """
    Execute complete SCM analysis pipeline:
    Fetches all artifacts, detects problems, and recommends prioritized fixes.
    """
    owner, repo = parse_github_url(request.url)
    return run_full_scm_analysis(owner, repo)


@router.post("/report/markdown", response_class=PlainTextResponse)
def get_markdown_audit_report(request: RepositoryRequest):
    """
    Generate and return a ready-to-publish GitHub-flavored Markdown SCM audit report.
    """
    owner, repo = parse_github_url(request.url)
    analysis = run_full_scm_analysis(owner, repo)
    return generate_markdown_report(analysis)


@router.post("/generate/readme")
def generate_readme_endpoint(request: RepositoryRequest):
    """Generate enterprise-ready README.md customized to the repository's stack."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    topics = get_topics(owner, repo)
    return generate_scm_readme(repo_meta, topics=topics)


@router.post("/generate/branch-strategy")
def generate_branch_strategy_endpoint(request: RepositoryRequest):
    """Generate SCM branching model, lifecycle rules, and Mermaid diagram."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    branches = get_branches(owner, repo)
    return generate_branching_strategy(branches, repo_meta.get("default_branch", "main"))


@router.post("/generate/release-plan")
def generate_release_plan_endpoint(request: RepositoryRequest):
    """Generate formal release plan, pre-release checklist, and categorized release notes."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    commits = get_commits(owner, repo, per_page=40)
    releases = get_releases(owner, repo, per_page=10)
    return generate_release_plan(repo_meta, commits, releases)


@router.post("/generate/commit-guide")
def generate_commit_guide_endpoint(request: RepositoryRequest):
    """Inspect recent commit messages, simulate Conventional Commit rewrites, and generate guide."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    commits = get_commits(owner, repo, per_page=30)
    return analyze_and_rewrite_commits(commits, repo_meta.get("name", repo))


@router.post("/generate/workflow")
def generate_workflow_endpoint(request: RepositoryRequest):
    """Generate language-specific GitHub Actions continuous integration workflow YAML."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    return generate_ci_workflow(repo_meta, repo_meta.get("default_branch", "main"))


@router.post("/impact-analysis")
def impact_analysis_endpoint(request: RepositoryRequest):
    """Perform change impact analysis estimating module sensitivity and conflict probability."""
    owner, repo = parse_github_url(request.url)
    repo_meta = get_repository(owner, repo)
    branches = get_branches(owner, repo)
    commits = get_commits(owner, repo, per_page=30)
    pull_requests = get_pull_requests(owner, repo, state="open", per_page=30)
    return analyze_change_impact(repo_meta, branches, commits, pull_requests)
