import pytest
from fastapi import HTTPException
from app.services.executor.readme_executor import compute_text_diff, analyze_missing_sections
from app.services.executor.release_executor import compute_next_semver
from app.services.executor.branch_executor import create_branch_plan
from app.services.executor.engine import stage_plan, execute_plan, list_staged_plans
from app.services.executor.timeline import load_timeline, record_activity, clear_timeline
from app.routes.executor import (
    connection_status_endpoint,
    plan_branch_action_endpoint,
    apply_plan_endpoint,
    list_plans_endpoint,
)
from app.services.executor.models import BranchActionRequest, PlanApprovalRequest


def test_compute_text_diff():
    old_text = "# Project\n\nOld description."
    new_text = "# Project\n\nNew enterprise description.\n\n## Installation\nRun npm install"
    diff = compute_text_diff(old_text, new_text)
    assert diff["additions_count"] > 0
    assert "Installation" in diff["unified_diff"]


def test_analyze_missing_sections():
    incomplete = "# My App\nJust a test."
    analysis = analyze_missing_sections(incomplete)
    assert "Installation & Setup" in analysis["missing_sections"]
    assert "License Terms" in analysis["missing_sections"]
    assert analysis["completeness_score"] < 50

    complete = """# Full App
[![CI](https://img.shields.io/badge/CI-Passing-green)](link)
## Architecture & Tech Stack
Python, React
## Prerequisites & Requirements
Node 18+
## Installation & Setup
git clone repo
## Usage & Workflow Commands
npm start
## Branching Strategy
GitFlow
## Contributing & Conventional Commits
Please use Conventional Commits
## License Terms
MIT License
"""
    comp_analysis = analyze_missing_sections(complete)
    assert comp_analysis["completeness_score"] >= 80


def test_compute_next_semver():
    tags = ["v1.0.0", "v1.2.3"]
    # Feature commit bump to minor
    commits = [{"commit": {"message": "feat(auth): add OAuth2 provider"}}]
    next_tag = compute_next_semver(tags, commits)
    assert next_tag == "v1.3.0"

    # Breaking change bump to major
    breaking_commits = [{"commit": {"message": "feat!: breaking change redesign"}}]
    next_tag_major = compute_next_semver(tags, breaking_commits)
    assert next_tag_major == "v2.0.0"

    # Fix bump to patch
    fix_commits = [{"commit": {"message": "fix(login): handle null token"}}]
    next_tag_patch = compute_next_semver(tags, fix_commits)
    assert next_tag_patch == "v1.2.4"


def test_branch_safety_rule():
    # Attempting to delete default branch should raise an exception
    with pytest.raises(ValueError) as exc:
        create_branch_plan("owner", "repo", action="delete", branch_name="main")
    assert "forbidden" in str(exc.value).lower() or "cannot delete default" in str(exc.value).lower()


def test_timeline_persistence():
    clear_timeline()
    entry = record_activity(
        plan_id="TEST-001",
        action_type="readme_update",
        repository="owner/repo",
        status="SUCCESS",
        summary="Updated README file",
        commit_sha="abc1234"
    )
    assert entry["id"].startswith("ACT-")
    history = load_timeline()
    assert len(history) >= 1
    assert history[0]["plan_id"] == "TEST-001"
    clear_timeline()
    assert len(load_timeline()) == 0


def test_api_connection_status():
    data = connection_status_endpoint()
    assert "authenticated" in data
    assert "rate_limit" in data


def test_api_branch_safety_endpoint():
    # Attempting to delete main via API endpoint should raise HTTPException 400
    req = BranchActionRequest(url="owner/repo", action="delete", branch_name="main")
    with pytest.raises(HTTPException) as exc_info:
        plan_branch_action_endpoint(req)
    assert exc_info.value.status_code == 400
    assert "default branch" in exc_info.value.detail.lower()


def test_api_safe_execution_flow():
    # 1. Create a staged plan directly
    plan = {
        "plan_id": "TEST-PLAN-999",
        "action_type": "issue_create",
        "repository": "owner/repo",
        "title": "Test Issue Plan",
        "description": "Test issue plan description",
        "impact_level": "LOW",
        "requires_approval": True,
        "approval_status": "pending",
        "diff": {},
        "payload": {
            "owner": "owner",
            "repo": "repo",
            "action": "create",
            "title": "Fix memory leak",
            "body": "Details"
        },
        "created_at": "now"
    }
    stage_plan(plan)

    # 2. Verify it shows up in staged plans
    plans = list_plans_endpoint()
    plan_ids = [p["plan_id"] for p in plans]
    assert "TEST-PLAN-999" in plan_ids

    # 3. Test Rejection
    reject_res = apply_plan_endpoint(
        PlanApprovalRequest(plan_id="TEST-PLAN-999", approved=False, rejection_reason="Not needed right now")
    )
    assert reject_res["status"] == "REJECTED"

    # 4. Re-stage and test approval
    stage_plan(plan)
    from unittest.mock import patch
    with patch("app.services.executor.engine.execute_issue_action", return_value={"success": True, "action": "create", "issue_number": 42}):
        approve_res = apply_plan_endpoint(
            PlanApprovalRequest(plan_id="TEST-PLAN-999", approved=True)
        )
    assert approve_res["success"] is True
    assert "timeline_id" in approve_res
