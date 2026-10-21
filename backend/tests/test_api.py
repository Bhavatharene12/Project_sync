from unittest.mock import patch
import pytest
from fastapi import HTTPException
from app.routes.github import get_mock_repository, scan_repository, full_scan_repository
from app.routes.scm import scm_status, audit_repository_scm, get_markdown_audit_report
from app.models.repository import RepositoryRequest


def test_mock_github_repo_route():
    data = get_mock_repository()
    assert data["repository"] == "Sync"
    assert data["owner"] == "Bhava"
    assert data["status"] == "Healthy"


def test_scm_status_route():
    data = scm_status()
    assert data["assistant"] == "Sync AI SCM Assistant"
    assert len(data["capabilities"]) > 0


def test_scan_repository_invalid_url():
    req = RepositoryRequest(url="invalid-url-format")
    with pytest.raises(HTTPException) as exc_info:
        scan_repository(req)
    assert exc_info.value.status_code == 400


def test_scan_repository_contract():
    mock_repo = {
        "name": "Sync",
        "owner": {"login": "octocat"},
        "description": "An AI SCM Assistant",
        "language": "Python",
        "stargazers_count": 150,
        "forks_count": 25,
        "open_issues_count": 5,
        "default_branch": "main"
    }
    mock_branches = [{"name": "main"}, {"name": "feat/scan"}]
    mock_readme = "# Sync\n## Installation\n`pip install`\n## Usage\nRun app\n## Features\nSCM\n## License\nMIT\n## Contributing\nPRs welcome\n" + ("x" * 1000)

    with patch("app.routes.github.get_repository", return_value=mock_repo), \
         patch("app.routes.github.get_readme", return_value=mock_readme), \
         patch("app.routes.github.get_branches", return_value=mock_branches):

        req = RepositoryRequest(url="https://github.com/octocat/Sync")
        data = scan_repository(req)

        # Verify exact contract for frontend
        assert data["success"] is True
        assert data["repository"] == "Sync"
        assert data["owner"] == "octocat"
        assert data["language"] == "Python"
        assert data["stars"] == 150
        assert data["forks"] == 25
        assert data["issues"] == 5
        assert data["default_branch"] == "main"
        assert data["health_score"] > 0
        assert "health_status" in data
        assert "ai_reasons" in data
        assert "readme_score" in data
        assert "readme_status" in data
        assert "readme_strengths" in data
        assert "readme_improvements" in data
        assert "branch_score" in data
        assert "branch_status" in data
        assert data["branch_count"] == 2
        assert "branch_strengths" in data
        assert "branch_suggestions" in data


def test_full_scan_repository():
    mock_repo = {
        "name": "Sync",
        "owner": {"login": "octocat"},
        "description": "An AI SCM Assistant",
        "language": "Python",
        "stargazers_count": 150,
        "forks_count": 25,
        "open_issues_count": 5,
        "default_branch": "main"
    }
    mock_branches = [{"name": "main"}]
    mock_readme = "# Sync"
    mock_commits = [{"commit": {"message": "feat: init", "author": {"name": "Dev"}}}]
    mock_pulls = []
    mock_releases = []
    mock_tags = []
    mock_workflows = []
    mock_contributors = [{"login": "Dev", "contributions": 10}]

    with patch("app.routes.github.get_repository", return_value=mock_repo), \
         patch("app.routes.github.get_readme", return_value=mock_readme), \
         patch("app.routes.github.get_branches", return_value=mock_branches), \
         patch("app.routes.github.get_commits", return_value=mock_commits), \
         patch("app.routes.github.get_pull_requests", return_value=mock_pulls), \
         patch("app.routes.github.get_releases", return_value=mock_releases), \
         patch("app.routes.github.get_tags", return_value=mock_tags), \
         patch("app.routes.github.get_workflows", return_value=mock_workflows), \
         patch("app.routes.github.get_contributors", return_value=mock_contributors):

        req = RepositoryRequest(url="octocat/Sync")
        data = full_scan_repository(req)

        assert data["recent_commits_count"] == 1
        assert data["contributors_count"] == 1
        assert "scm_problems_detected" in data


def test_scm_audit_and_markdown_report():
    mock_analysis = {
        "report": {
            "generated_at": "2026-10-22T00:00:00Z",
            "health_grade": "Healthy",
            "summary": "Repository is well maintained.",
            "problems": [],
            "recommendations": [],
            "available_tasks": []
        },
        "metadata": {"name": "Sync", "owner": {"login": "octocat"}, "language": "Python", "default_branch": "main"},
        "health": {"score": 90, "health": "Healthy"},
        "readme": {"score": 85, "status": "Good"},
        "branches": {"score": 90, "status": "Excellent", "total_branches": 3},
        "commits_audit": {"conventional_commit_rate": 80.0, "status": "Healthy"},
        "release_audit": {"semver_compliance_rate": 100.0, "status": "Healthy", "total_releases": 2},
        "workflow_audit": {"ci_pass_rate": 100.0, "status": "Healthy", "total_workflows": 1}
    }

    with patch("app.routes.scm.run_full_scm_analysis", return_value=mock_analysis):
        req = RepositoryRequest(url="https://github.com/octocat/Sync")
        audit_data = audit_repository_scm(req)
        assert audit_data["report"]["health_grade"] == "Healthy"

        md_report = get_markdown_audit_report(req)
        assert "# Sync AI SCM Audit Report" in md_report
        assert "octocat/Sync" in md_report
