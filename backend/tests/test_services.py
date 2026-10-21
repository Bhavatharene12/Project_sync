import pytest
from app.services.ai.ai_analyzer import calculate_health
from app.services.ai.readme_analyzer import analyze_readme
from app.services.scm.branch_analyzer import analyze_branches
from app.services.scm.commit_auditor import audit_commits
from app.services.scm.release_manager import audit_releases
from app.services.scm.workflow_auditor import audit_workflows
from app.services.ai.scm_recommender import generate_scm_recommendations


def test_calculate_health_popular_repo():
    repo = {
        "stargazers_count": 1500,
        "open_issues_count": 25,
        "forks_count": 300,
        "description": "A high-performance modern web framework."
    }
    result = calculate_health(repo)
    assert result["score"] == 100
    assert result["health"] == "Healthy"
    assert "Popular repository." in result["reasons"]
    assert "Strong community contributions." in result["reasons"]


def test_calculate_health_low_stars_no_desc():
    repo = {
        "stargazers_count": 10,
        "open_issues_count": 5,
        "forks_count": 0,
        "description": None
    }
    result = calculate_health(repo)
    assert result["score"] == 65
    assert result["health"] == "Needs Attention"
    assert "Very few stars." in result["reasons"]
    assert "Missing repository description." in result["reasons"]


def test_analyze_readme_full():
    content = """
    # Awesome Project
    ## Features
    - Fast and lightweight
    - Easy to use
    ## Installation
    Run `npm install awesome`
    ## Usage
    Import awesome from 'awesome'
    ## Contributing
    Send PRs to main branch.
    ## License
    MIT License
    """ + ("extra description " * 100)

    result = analyze_readme(content)
    assert result["score"] == 100
    assert result["status"] == "Excellent"
    assert len(result["strengths"]) == 5
    assert len(result["improvements"]) == 0


def test_analyze_readme_empty():
    result = analyze_readme("")
    assert result["score"] == 0
    assert result["status"] == "README Not Found"
    assert "Repository has no README." in result["improvements"]


def test_analyze_branches_single_branch():
    branches = [{"name": "master"}]
    result = analyze_branches(branches, default_branch="master")
    assert result["score"] < 80
    assert "Only one branch detected. Consider feature branches." in result["suggestions"]
    assert "Default branch is not 'main'." in result["suggestions"]


def test_analyze_branches_healthy():
    branches = [{"name": "main"}, {"name": "feat/login"}, {"name": "feat/api"}, {"name": "fix/nav"}, {"name": "staging"}]
    result = analyze_branches(branches, default_branch="main")
    assert result["score"] >= 85
    assert result["status"] == "Excellent"
    assert "Repository uses multiple branches." in result["strengths"]
    assert "Uses 'main' as default branch." in result["strengths"]


def test_commit_auditor():
    commits = [
        {"commit": {"message": "feat: add user authentication", "author": {"name": "Alice"}}},
        {"commit": {"message": "fix: resolve token expiry bug", "author": {"name": "Bob"}}},
        {"commit": {"message": "docs: update API documentation", "author": {"name": "Alice"}}},
    ]
    result = audit_commits(commits)
    assert result["conventional_commit_rate"] == 100.0
    assert result["distinct_authors"] == 2
    assert result["status"] == "Healthy"


def test_scm_recommender():
    repo = {"name": "Sync", "language": "Python"}
    readme = {"score": 40, "improvements": ["Add an Installation section."]}
    branch = {"score": 60, "total_branches": 1, "status": "Poor"}
    commits = []
    pulls = []
    releases = []
    workflows = []

    problems, recs, tasks = generate_scm_recommendations(
        repo, readme, branch, commits, pulls, releases, workflows
    )
    assert len(problems) > 0
    assert len(recs) > 0
    assert len(tasks) > 0
    categories = [p.category for p in problems]
    assert "documentation" in categories
    assert "branching" in categories
    assert "ci_cd" in categories
    assert "releases" in categories
