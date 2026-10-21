from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TokenVerifyRequest(BaseModel):
    token: Optional[str] = None


class RateLimitInfo(BaseModel):
    limit: int = 60
    remaining: int = 60
    reset: int = 0
    reset_time: Optional[str] = None
    used: int = 0


class GitHubUser(BaseModel):
    login: str
    id: int
    avatar_url: str
    html_url: str
    name: Optional[str] = None
    email: Optional[str] = None
    public_repos: int = 0
    total_private_repos: Optional[int] = 0
    plan: Optional[str] = None


class TokenVerifyResponse(BaseModel):
    authenticated: bool
    user: Optional[GitHubUser] = None
    scopes: List[str] = Field(default_factory=list)
    has_repo_scope: bool = False
    has_workflow_scope: bool = False
    rate_limit: RateLimitInfo
    repositories: List[Dict[str, Any]] = Field(default_factory=list)
    message: str = "Success"


class ExecutionPlan(BaseModel):
    plan_id: str
    action_type: str  # readme_update, branch_create, branch_delete, branch_protect, pr_merge, issue_create, issue_close, release_publish, workflow_commit, batch_cleanup
    repository: str
    title: str
    description: str
    impact_level: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    requires_approval: bool = True
    approval_status: str = "pending"  # pending, approved, rejected, executed
    diff: Optional[Dict[str, Any]] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    rollback_strategy: Optional[str] = None
    created_at: str


class PlanApprovalRequest(BaseModel):
    plan_id: str
    approved: bool
    token: Optional[str] = None
    rejection_reason: Optional[str] = None


class ExecutionReceipt(BaseModel):
    plan_id: str
    action_type: str
    repository: str
    status: str  # SUCCESS, FAILED, SIMULATED
    summary: str
    timestamp: str
    commit_sha: Optional[str] = None
    resource_url: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    verified: bool = False
    verification_message: Optional[str] = None
    operator: str = "Sync AI SCM Assistant"


class ReadmePlanRequest(BaseModel):
    url: str
    content: Optional[str] = None
    commit_message: Optional[str] = "docs(readme): synchronize enterprise SCM documentation [skip ci]"
    branch: Optional[str] = None
    token: Optional[str] = None


class BranchActionRequest(BaseModel):
    url: str
    action: str  # create, delete, rename, protect
    branch_name: str
    target_branch: Optional[str] = None  # for rename or create source
    token: Optional[str] = None


class PullRequestMergeRequest(BaseModel):
    url: str
    pull_number: int
    merge_method: str = "squash"  # merge, squash, rebase
    commit_title: Optional[str] = None
    commit_message: Optional[str] = None
    token: Optional[str] = None


class IssueActionRequest(BaseModel):
    url: str
    action: str  # create, close, label, assign
    issue_number: Optional[int] = None
    title: Optional[str] = None
    body: Optional[str] = None
    labels: Optional[List[str]] = None
    assignees: Optional[List[str]] = None
    token: Optional[str] = None


class ReleasePublishRequest(BaseModel):
    url: str
    tag_name: str
    name: Optional[str] = None
    body: Optional[str] = None
    target_commitish: Optional[str] = None
    draft: bool = False
    prerelease: bool = False
    token: Optional[str] = None


class WorkflowCommitRequest(BaseModel):
    url: str
    filename: str  # e.g., ci.yml
    content: str
    commit_message: Optional[str] = "ci(workflow): configure automated CI pipeline via Sync SCM"
    branch: Optional[str] = None
    token: Optional[str] = None


class CleanupExecuteRequest(BaseModel):
    url: str
    actions: List[Dict[str, Any]]
    token: Optional[str] = None
