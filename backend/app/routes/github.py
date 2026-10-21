from fastapi import APIRouter
from app.models.repository import (
    RepositoryRequest,
    RepoMockResponse,
    RepositoryScanResponse,
    ComprehensiveScanResponse,
)
from app.utils.url_parser import parse_github_url
from app.services.github import (
    get_repository,
    get_readme,
    get_branches,
    get_commits,
    get_pull_requests,
    get_releases,
    get_workflows,
    get_tags,
    get_contributors,
)
from app.services.ai.ai_analyzer import calculate_health
from app.services.ai.readme_analyzer import analyze_readme
from app.services.scm.branch_analyzer import analyze_branches
from app.services.ai.scm_recommender import generate_scm_recommendations

router = APIRouter(prefix="/github", tags=["GitHub"])


@router.get("/repo", response_model=RepoMockResponse)
def get_mock_repository():
    """
    Overview repository data for Dashboard demonstration.
    Preserves exact response contract for existing frontend.
    """
    return {
        "repository": "Sync",
        "owner": "Bhava",
        "language": "Python",
        "stars": 25,
        "branches": 12,
        "status": "Healthy"
    }


@router.post("/scan", response_model=RepositoryScanResponse)
def scan_repository(request: RepositoryRequest):
    """
    Scan a GitHub repository and calculate multidimensional SCM health scores.
    Supports all URL formats (full URL, shorthand user/repo, .git, etc.).
    Uses authenticated requests when GITHUB_TOKEN is configured.
    Raises proper HTTP errors on failure (400 for bad URL, 404 for not found, 429 for rate limit).
    """
    owner, repository = parse_github_url(request.url)

    # 1. Fetch Repository Metadata
    repo = get_repository(owner, repository)

    default_branch = repo.get("default_branch", "main")

    # 2. Fetch README Content
    readme_text = get_readme(owner, repository)

    # 3. Fetch Branches
    branches = get_branches(owner, repository)

    # 4. Compute Health & Hygiene Analysis
    health_result = calculate_health(repo)
    readme_result = analyze_readme(readme_text or "")
    branch_result = analyze_branches(branches, default_branch)

    # 5. Return Structured Response (100% compatible with existing frontend)
    return {
        "success": True,
        "repository": repo.get("name", repository),
        "owner": repo.get("owner", {}).get("login", owner),
        "description": repo.get("description"),
        "language": repo.get("language"),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "issues": repo.get("open_issues_count", 0),
        "default_branch": default_branch,

        # Health
        "health_score": health_result["score"],
        "health_status": health_result["health"],
        "ai_reasons": health_result["reasons"],

        # README
        "readme_score": readme_result["score"],
        "readme_status": readme_result["status"],
        "readme_strengths": readme_result["strengths"],
        "readme_improvements": readme_result["improvements"],

        # Branches
        "branch_score": branch_result["score"],
        "branch_status": branch_result["status"],
        "branch_count": branch_result["total_branches"],
        "branch_strengths": branch_result["strengths"],
        "branch_suggestions": branch_result["suggestions"]
    }


@router.post("/full-scan", response_model=ComprehensiveScanResponse)
def full_scan_repository(request: RepositoryRequest):
    """
    Extended scan endpoint gathering complete SCM artifacts:
    Commits, PRs, Releases, Tags, Actions Workflows, Contributors, and SCM Recommendations.
    """
    owner, repository = parse_github_url(request.url)

    # Basic scan items
    repo = get_repository(owner, repository)
    default_branch = repo.get("default_branch", "main")
    readme_text = get_readme(owner, repository)
    branches = get_branches(owner, repository)

    # Extended SCM fetch engine items
    commits = get_commits(owner, repository, per_page=30)
    pull_requests = get_pull_requests(owner, repository, state="open", per_page=30)
    releases = get_releases(owner, repository, per_page=20)
    tags = get_tags(owner, repository, per_page=20)
    workflows = get_workflows(owner, repository)
    contributors = get_contributors(owner, repository, per_page=30)

    # Analysis
    health_result = calculate_health(repo)
    readme_result = analyze_readme(readme_text or "")
    branch_result = analyze_branches(branches, default_branch)

    problems, _, _ = generate_scm_recommendations(
        repo_data=repo,
        readme_result=readme_result,
        branch_result=branch_result,
        commits=commits,
        pull_requests=pull_requests,
        releases=releases,
        workflows=workflows
    )

    base_response = scan_repository(request)
    return {
        **base_response,
        "recent_commits_count": len(commits),
        "open_pull_requests_count": len(pull_requests),
        "releases_count": len(releases),
        "tags_count": len(tags),
        "workflows_count": len(workflows),
        "contributors_count": len(contributors),
        "scm_problems_detected": len(problems)
    }