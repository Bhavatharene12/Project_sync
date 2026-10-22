import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.services.executor.engine import stage_plan, execute_plan
from app.services.executor.error_handler import handle_executor_error
from app.services.github.github_workflows import get_workflow_runs
from app.services.scm.commit_assistant import _rewrite_message
from app.services.scm.scm_engine import compute_scm_scoring
from app.services.scm.impact_analyzer import analyze_change_impact
from app.routes.github import full_scan_repository
from app.models.repository import RepositoryRequest


def test_duplicate_plan_execution_returns_409():
    """Verify executing an already-approved/executed plan returns HTTP 409 Conflict."""
    plan = {
        "plan_id": "TEST-DUP-001",
        "action_type": "issue_create",
        "repository": "owner/repo",
        "title": "Duplicate Guard Test",
        "description": "Ensure plans cannot be executed twice",
        "impact_level": "LOW",
        "requires_approval": True,
        "approval_status": "pending",
        "diff": {},
        "payload": {
            "owner": "owner",
            "repo": "repo",
            "action": "create",
            "title": "Test Duplicate",
            "body": "Body"
        },
        "created_at": "now"
    }
    stage_plan(plan)

    # First execution succeeds (mocking underlying GitHub issue execution)
    from unittest.mock import patch
    with patch("app.services.executor.engine.execute_issue_action", return_value={"success": True, "action": "create", "issue_number": 99}):
        result = execute_plan("TEST-DUP-001", approved=True, token=None)
    assert result["success"] is True

    # Second execution must raise 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        execute_plan("TEST-DUP-001", approved=True, token=None)
    assert exc_info.value.status_code == 409
    assert "already executed" in exc_info.value.detail.lower()


def test_failed_github_write_error_handling():
    """Verify GitHub write rejections (401, 403, 404, etc.) return explicit failure without false success."""
    exc = HTTPException(status_code=403, detail="Resource not accessible by personal access token")
    err_res = handle_executor_error(
        exc=exc,
        action_attempted="commit_readme",
        token="ghp_real_personal_token"
    )
    assert err_res["success"] is False
    assert err_res["status"] == "FAILED"
    assert err_res["verified"] is False
    assert err_res["status_code"] == 403
    assert "Resource not accessible" in err_res["error_message"]
    assert err_res["action_attempted"] == "commit_readme"


def test_workflow_runs_with_optional_workflow_id():
    """Verify get_workflow_runs calls workflow-specific endpoint when workflow_id is provided."""
    with patch("app.services.github.github_workflows.github_client.get") as mock_get:
        mock_get.return_value = {"workflow_runs": [{"id": 1, "conclusion": "success"}]}

        # Call with workflow_id
        runs_specific = get_workflow_runs("octocat", "Hello-World", workflow_id="ci.yml")
        mock_get.assert_called_with(
            "/repos/octocat/Hello-World/actions/workflows/ci.yml/runs",
            params={"per_page": 20},
            allow_404=True
        )
        assert len(runs_specific) == 1

        # Call without workflow_id
        runs_all = get_workflow_runs("octocat", "Hello-World")
        mock_get.assert_called_with(
            "/repos/octocat/Hello-World/actions/runs",
            params={"per_page": 20},
            allow_404=True
        )
        assert len(runs_all) == 1


def test_commit_rewriter_context_aware_examples():
    """Verify specific required transformations and domain mappings in commit rewriter."""
    assert _rewrite_message("update login", "Sync") == "fix(auth): validate login credentials"
    assert _rewrite_message("changed readme", "Sync") == "docs(readme): improve installation guide"
    assert _rewrite_message("new dashboard", "Sync") == "feat(ui): add executive SCM dashboard"

    # Contextual domain mappings
    assert _rewrite_message("fix jwt expiry", "Sync") == "fix(auth): resolve jwt expiry"
    assert _rewrite_message("add sidebar button", "Sync") == "feat(ui): implement sidebar button"
    assert _rewrite_message("add test for parser", "Sync") == "test(test): add automated tests for parser"


def test_scm_weighted_scoring_and_grade_capping():
    """Verify weighted scoring formula and strict grade capping at B+ when requirements are violated."""
    health_result = {"score": 100}
    readme_result = {"score": 100}
    branch_result = {"score": 100, "total_branches": 5}
    branch_audit = {"stale_branches": 0}
    commit_audit = {"conventional_commit_rate": 100.0}
    workflow_audit = {"total_workflows": 3, "ci_pass_rate": 100.0, "recent_runs_inspected": 10}

    # Case 1: Missing releases caps grade to B+ and score <= 88 even if raw score is 93 (Grade A)
    release_audit_missing = {"total_releases": 0, "total_tags": 5, "semver_compliance_rate": 80.0}
    scoring_capped = compute_scm_scoring(
        health_result, readme_result, branch_result, branch_audit,
        commit_audit, release_audit_missing, workflow_audit
    )
    assert scoring_capped["is_capped"] is True
    assert scoring_capped["grade"] == "B+"
    assert scoring_capped["overall_score"] <= 88
    assert "Missing formal GitHub releases" in scoring_capped["cap_reasons"]

    # Case 2: Complete releases and all dimensions healthy receives A or A+
    release_audit_ok = {"total_releases": 5, "total_tags": 5, "semver_compliance_rate": 100.0}
    scoring_healthy = compute_scm_scoring(
        health_result, readme_result, branch_result, branch_audit,
        commit_audit, release_audit_ok, workflow_audit
    )
    assert scoring_healthy["is_capped"] is False
    assert scoring_healthy["grade"] in ("A", "A+")
    assert scoring_healthy["overall_score"] >= 90


def test_impact_analyzer_concrete_file_paths():
    """Verify impact analyzer returns concrete file paths matching the architecture."""
    repo = {"name": "Sync", "language": "Python", "open_issues_count": 5}
    branches = [{"name": "main"}, {"name": "feat/api"}]
    commits = [{"commit": {"message": "feat(api): new endpoint"}}]
    prs = [{"number": 1, "title": "feat: api router update"}]

    impact = analyze_change_impact(repo, branches, commits, prs)
    concrete_files = impact.get("affected_files", [])
    assert len(concrete_files) > 0
    # Concrete expected paths from Prompt 5 specifications
    expected_sample = {"backend/routes/github.py", "frontend/components/Sidebar.jsx", "README.md", "package.json", ".github/workflows/ci.yml"}
    assert any(f in expected_sample for f in concrete_files)


def test_full_scan_optimization_no_duplicate_calls():
    """Verify full-scan constructs base_response directly without duplicate network roundtrips."""
    with patch("app.routes.github.get_repository") as mock_get_repo, \
         patch("app.routes.github.get_readme") as mock_get_readme, \
         patch("app.routes.github.get_branches") as mock_get_branches, \
         patch("app.routes.github.get_commits", return_value=[]), \
         patch("app.routes.github.get_pull_requests", return_value=[]), \
         patch("app.routes.github.get_releases", return_value=[]), \
         patch("app.routes.github.get_tags", return_value=[]), \
         patch("app.routes.github.get_workflows", return_value=[]), \
         patch("app.routes.github.get_contributors", return_value=[]):

        mock_get_repo.return_value = {
            "name": "Sync",
            "owner": {"login": "octocat"},
            "description": "SCM Assistant",
            "language": "Python",
            "stargazers_count": 100,
            "forks_count": 10,
            "open_issues_count": 2,
            "default_branch": "main"
        }
        mock_get_readme.return_value = "# Sync\n## Installation\nrun"
        mock_get_branches.return_value = [{"name": "main"}, {"name": "dev"}]

        req = RepositoryRequest(url="https://github.com/octocat/Sync")
        res = full_scan_repository(req)

        # Ensure basic endpoints were called exactly once (no redundant duplicate calls)
        assert mock_get_repo.call_count == 1
        assert mock_get_readme.call_count == 1
        assert mock_get_branches.call_count == 1

        assert res["success"] is True
        assert res["repository"] == "Sync"
        assert res["default_branch"] == "main"
        assert "health_score" in res
