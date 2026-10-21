from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Header
from app.models.repository import RepositoryRequest
from app.utils.url_parser import parse_github_url
from app.services.executor.models import (
    TokenVerifyRequest,
    PlanApprovalRequest,
    ReadmePlanRequest,
    BranchActionRequest,
    PullRequestMergeRequest,
    IssueActionRequest,
    ReleasePublishRequest,
    WorkflowCommitRequest,
    CleanupExecuteRequest,
)
from app.services.executor import (
    verify_connection,
    create_readme_plan,
    fetch_extended_branches,
    create_branch_plan,
    fetch_prs_with_review,
    create_pr_merge_plan,
    fetch_categorized_issues,
    create_issue_plan,
    create_release_plan,
    fetch_extended_workflows,
    create_workflow_plan,
    generate_repository_cleanup_plan,
    load_timeline,
    clear_timeline,
    stage_plan,
    get_staged_plan,
    list_staged_plans,
    execute_plan,
)

router = APIRouter(prefix="/github/execute", tags=["GitHub SCM Execution Engine"])


def _extract_token(auth_header: Optional[Any], body_token: Optional[str] = None) -> Optional[str]:
    """Helper to extract Bearer token from header or request body."""
    if body_token and isinstance(body_token, str) and body_token.strip():
        return body_token.strip()
    if isinstance(auth_header, str) and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None


# -------------------------------------------------------------
# Module 1: GitHub Connection & Repository Discovery
# -------------------------------------------------------------
@router.post("/connection/verify")
def verify_token_endpoint(
    req: TokenVerifyRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Verify GitHub Personal Access Token authentication, detect scopes,
    check rate limits, and list accessible repositories.
    """
    token = _extract_token(authorization, req.token)
    return verify_connection(token=token)


@router.get("/connection/status")
def connection_status_endpoint(authorization: Optional[str] = Header(None)):
    """Check current GitHub authentication and remaining API rate limit."""
    token = _extract_token(authorization)
    return verify_connection(token=token)


# -------------------------------------------------------------
# Staged Plans Management & Approval Gatekeeper
# -------------------------------------------------------------
@router.get("/plans")
def list_plans_endpoint():
    """List all staged plans awaiting approval or recently reviewed."""
    return list_staged_plans()


@router.get("/plans/{plan_id}")
def get_plan_endpoint(plan_id: str):
    """Get detailed specification and diff of a staged execution plan."""
    plan = get_staged_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found.")
    return plan


@router.post("/apply")
def apply_plan_endpoint(
    req: PlanApprovalRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Approve or reject a staged execution plan and trigger verified execution on GitHub.
    Enforces the SCM Safe Execution Gate.
    """
    token = _extract_token(authorization, req.token)
    try:
        return execute_plan(
            plan_id=req.plan_id,
            approved=req.approved,
            token=token,
            rejection_reason=req.rejection_reason
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# -------------------------------------------------------------
# Module 2: Real README Updater
# -------------------------------------------------------------
@router.post("/readme/plan")
def plan_readme_update_endpoint(
    req: ReadmePlanRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Fetch existing README, detect missing sections, generate diff,
    and stage an approval-required execution plan.
    """
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    plan = create_readme_plan(
        owner=owner,
        repo=repo,
        proposed_content=req.content,
        commit_message=req.commit_message or "docs(readme): synchronize enterprise SCM documentation",
        branch=req.branch,
        token=token
    )
    return stage_plan(plan)


# -------------------------------------------------------------
# Module 3: Branch Manager
# -------------------------------------------------------------
@router.post("/branches/list")
def list_branches_extended_endpoint(
    req: RepositoryRequest,
    authorization: Optional[str] = Header(None)
):
    """Fetch all branches with staleness analysis, protection status, and recommendations."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization)
    return fetch_extended_branches(owner, repo, token=token)


@router.post("/branches/plan")
def plan_branch_action_endpoint(
    req: BranchActionRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Stage a branch management action (create, delete, rename, protect) with safety checks.
    """
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    try:
        plan = create_branch_plan(
            owner=owner,
            repo=repo,
            action=req.action,
            branch_name=req.branch_name,
            target_branch=req.target_branch,
            token=token
        )
        return stage_plan(plan)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# -------------------------------------------------------------
# Module 4: Pull Request Assistant
# -------------------------------------------------------------
@router.post("/prs/list")
def list_prs_extended_endpoint(
    req: RepositoryRequest,
    authorization: Optional[str] = Header(None)
):
    """Fetch pull requests with review summary and merge recommendations."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization)
    return fetch_prs_with_review(owner, repo, token=token)


@router.post("/prs/merge/plan")
def plan_pr_merge_endpoint(
    req: PullRequestMergeRequest,
    authorization: Optional[str] = Header(None)
):
    """Stage a pull request merge operation with squash/merge strategy."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    plan = create_pr_merge_plan(
        owner=owner,
        repo=repo,
        pull_number=req.pull_number,
        merge_method=req.merge_method,
        commit_title=req.commit_title,
        commit_message=req.commit_message,
        token=token
    )
    return stage_plan(plan)


# -------------------------------------------------------------
# Module 5: Issue Manager
# -------------------------------------------------------------
@router.post("/issues/list")
def list_issues_categorized_endpoint(
    req: RepositoryRequest,
    authorization: Optional[str] = Header(None)
):
    """Fetch and triage repository issues categorized by SCM type."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization)
    return fetch_categorized_issues(owner, repo, token=token)


@router.post("/issues/plan")
def plan_issue_action_endpoint(
    req: IssueActionRequest,
    authorization: Optional[str] = Header(None)
):
    """Stage an issue operation (create, close, label, assign)."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    plan = create_issue_plan(
        owner=owner,
        repo=repo,
        action=req.action,
        issue_number=req.issue_number,
        title=req.title,
        body=req.body,
        labels=req.labels,
        assignees=req.assignees,
        token=token
    )
    return stage_plan(plan)


# -------------------------------------------------------------
# Module 6: Release Manager
# -------------------------------------------------------------
@router.post("/release/plan")
def plan_release_publish_endpoint(
    req: ReleasePublishRequest,
    authorization: Optional[str] = Header(None)
):
    """Resolve next SemVer tag, synthesize changelog, and stage release publish plan."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    plan = create_release_plan(
        owner=owner,
        repo=repo,
        target_tag=req.tag_name if req.tag_name != "auto" else None,
        release_name=req.name,
        custom_body=req.body,
        draft=req.draft,
        prerelease=req.prerelease,
        token=token
    )
    return stage_plan(plan)


# -------------------------------------------------------------
# Module 7: Workflow Manager
# -------------------------------------------------------------
@router.post("/workflows/list")
def list_workflows_extended_endpoint(
    req: RepositoryRequest,
    authorization: Optional[str] = Header(None)
):
    """List GitHub Actions workflows and their execution runs."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization)
    return fetch_extended_workflows(owner, repo, token=token)


@router.post("/workflows/plan")
def plan_workflow_commit_endpoint(
    req: WorkflowCommitRequest,
    authorization: Optional[str] = Header(None)
):
    """Stage committing a new or updated GitHub Actions workflow YAML."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization, req.token)
    plan = create_workflow_plan(
        owner=owner,
        repo=repo,
        filename=req.filename,
        content=req.content,
        commit_message=req.commit_message,
        branch=req.branch,
        token=token
    )
    return stage_plan(plan)


# -------------------------------------------------------------
# Module 8: Repository Cleanup Assistant
# -------------------------------------------------------------
@router.post("/cleanup/plan")
def plan_cleanup_bundle_endpoint(
    req: RepositoryRequest,
    authorization: Optional[str] = Header(None)
):
    """Analyze repository and generate multi-step checkable hygiene cleanup bundle."""
    owner, repo = parse_github_url(req.url)
    token = _extract_token(authorization)
    cleanup_data = generate_repository_cleanup_plan(owner, repo, token=token)

    plan = {
        "plan_id": f"PLAN-CLEANUP-{repo.lower()}",
        "action_type": "batch_cleanup",
        "repository": f"{owner}/{repo}",
        "title": f"Repository SCM Cleanup Bundle for {owner}/{repo}",
        "description": f"Execute {len(cleanup_data['tasks'])} hygiene repairs (prune stale branches, add LICENSE, install PR template, protect default branch).",
        "impact_level": "HIGH",
        "requires_approval": True,
        "approval_status": "pending",
        "diff": {
            "total_items": len(cleanup_data["tasks"]),
            "items": cleanup_data["tasks"]
        },
        "payload": {
            "owner": owner,
            "repo": repo,
            "tasks": cleanup_data["tasks"]
        },
        "rollback_strategy": "Individual actions can be reverted (branches restored, files removed).",
        "created_at": "now"
    }

    return stage_plan(plan)


# -------------------------------------------------------------
# Module 9: SCM Activity Timeline
# -------------------------------------------------------------
@router.get("/timeline")
def get_timeline_endpoint():
    """Retrieve full audit trail of executed SCM operations."""
    return load_timeline()


@router.delete("/timeline")
def clear_timeline_endpoint():
    """Reset and clear the SCM activity timeline."""
    clear_timeline()
    return {"message": "SCM activity timeline cleared."}
