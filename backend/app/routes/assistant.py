"""
Unified API Router for Sync AI SCM Assistant Features:
1. /assistant/workspace (Today's Workspace Triage)
2. /assistant/team-sync (Team Change Log)
3. /assistant/essentials/status & /assistant/essentials/install (Missing Essentials)
4. /assistant/commit/synthesize (Smart Commit Assistant)
5. /assistant/contributions/diagnose (Contribution Doctor)
6. /assistant/branches/audit & /assistant/branches/delete (Safe Branch Cleaner)
7. /assistant/fork/status & /assistant/fork/sync (Upstream Fork Synchronizer)
8. /assistant/project-review & /assistant/project-review/export (Project Review Generator)
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from app.services.scm.workspace_service import get_workspace_triage
from app.services.scm.team_sync_service import get_team_change_log
from app.services.scm.essentials_service import audit_essentials, install_essential_file
from app.services.scm.commit_assistant import (
    synthesize_commit,
    get_recent_commits_for_assistant,
    analyze_commit_files_for_assistant
)
from app.services.scm.contribution_doctor import diagnose_contributions
from app.services.scm.branch_cleaner import audit_branches, delete_branch
from app.services.scm.fork_service import get_fork_status, sync_upstream_fork
from app.services.scm.project_review_service import generate_project_review, commit_report_to_repo
from app.services.scm.risk_analyzer_service import analyze_repository_risk
from app.services.scm.release_readiness_service import audit_release_readiness
from app.services.scm.conflict_predictor_service import predict_merge_conflicts

router = APIRouter(prefix="/assistant", tags=["SCM Assistant"])


# Dependency to extract Bearer token if provided in header
def get_auth_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization.replace("Bearer ", "").strip()
    return None


class BaseRepoRequest(BaseModel):
    url: str = Field(..., description="Repository URL or owner/repo format")
    token: Optional[str] = Field(None, description="GitHub Personal Access Token")


class TeamSyncRequest(BaseRepoRequest):
    hours: Optional[int] = 72


class EssentialsInstallRequest(BaseRepoRequest):
    path: str
    content: Optional[str] = None
    commit_message: Optional[str] = None
    branch: Optional[str] = None


class CommitSynthesizeRequest(BaseModel):
    draft_message: str
    diff_text: Optional[str] = None


class CommitAnalyzeShaRequest(BaseRepoRequest):
    sha: str


class BranchDeleteRequest(BaseRepoRequest):
    branch_name: str
    force: Optional[bool] = False


class ForkSyncRequest(BaseRepoRequest):
    branch: Optional[str] = None


class ProjectReviewExportRequest(BaseRepoRequest):
    content: str
    path: Optional[str] = "PROJECT_SCM_REPORT.md"


class ConflictPredictRequest(BaseRepoRequest):
    base_branch: Optional[str] = None
    target_branch: Optional[str] = None


# 1. Today's Workspace
@router.post("/workspace")
def workspace_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return get_workspace_triage(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 2. Team Change Log
@router.post("/team-sync")
def team_sync_endpoint(req: TeamSyncRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return get_team_change_log(req.url, hours=req.hours or 72, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 3. Missing Essentials Status & Install
@router.post("/essentials/status")
def essentials_status_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return audit_essentials(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/essentials/install")
def essentials_install_endpoint(req: EssentialsInstallRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        res = install_essential_file(
            repo_url=req.url,
            path=req.path,
            content=req.content,
            commit_message=req.commit_message,
            branch=req.branch,
            token=token
        )
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 4. Smart Commit Assistant
@router.post("/commit/synthesize")
def commit_synthesize_endpoint(req: CommitSynthesizeRequest):
    try:
        return synthesize_commit(draft_message=req.draft_message, diff_text=req.diff_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/commit/recent")
def commit_recent_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return get_recent_commits_for_assistant(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/commit/analyze-sha")
def commit_analyze_sha_endpoint(req: CommitAnalyzeShaRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return analyze_commit_files_for_assistant(req.url, req.sha, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 5. Contribution Doctor
@router.post("/contributions/diagnose")
def contributions_diagnose_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return diagnose_contributions(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 6. Safe Branch Cleaner
@router.post("/branches/audit")
def branches_audit_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return audit_branches(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/branches/delete")
def branches_delete_endpoint(req: BranchDeleteRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        res = delete_branch(req.url, branch_name=req.branch_name, force=req.force, token=token)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 7. Upstream Fork Synchronizer
@router.post("/fork/status")
def fork_status_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return get_fork_status(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/fork/sync")
def fork_sync_endpoint(req: ForkSyncRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        res = sync_upstream_fork(req.url, branch=req.branch, token=token)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 8. Project Review Generator
@router.post("/project-review")
def project_review_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return generate_project_review(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/project-review/export")
def project_review_export_endpoint(req: ProjectReviewExportRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        res = commit_report_to_repo(req.url, content=req.content, path=req.path or "PROJECT_SCM_REPORT.md", token=token)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 9. Repository Risk Analyzer
@router.post("/risk/analyze")
def risk_analyze_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return analyze_repository_risk(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 10. Release Readiness Checker
@router.post("/release/audit")
def release_audit_endpoint(req: BaseRepoRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return audit_release_readiness(req.url, token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 11. Merge Conflict Predictor
@router.post("/conflicts/predict")
def conflicts_predict_endpoint(req: ConflictPredictRequest, header_token: Optional[str] = Depends(get_auth_token)):
    token = req.token or header_token
    try:
        return predict_merge_conflicts(
            req.url,
            base_branch=req.base_branch,
            target_branch=req.target_branch,
            token=token
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
