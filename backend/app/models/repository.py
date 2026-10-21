from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class RepositoryRequest(BaseModel):
    """Incoming request to scan or inspect a repository."""
    url: str = Field(..., description="GitHub repository URL or 'owner/repo' format")


class RepoMockResponse(BaseModel):
    """Legacy mock repository data for dashboard overview."""
    repository: str
    owner: str
    language: str
    stars: int
    branches: int
    status: str


class RepositoryScanResponse(BaseModel):
    """
    Complete response model for the /github/scan endpoint.
    Maintains 100% backward compatibility with existing React UI.
    """
    success: bool = True
    repository: str
    owner: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int
    forks: int
    issues: int
    default_branch: str

    # AI Health
    health_score: int
    health_status: str
    ai_reasons: List[str] = Field(default_factory=list)

    # README Analysis
    readme_score: int
    readme_status: str
    readme_strengths: List[str] = Field(default_factory=list)
    readme_improvements: List[str] = Field(default_factory=list)

    # Branch Analysis
    branch_score: int
    branch_status: str
    branch_count: int
    branch_strengths: List[str] = Field(default_factory=list)
    branch_suggestions: List[str] = Field(default_factory=list)


class ComprehensiveScanResponse(RepositoryScanResponse):
    """Extended scan response incorporating deep SCM data."""
    recent_commits_count: int = 0
    open_pull_requests_count: int = 0
    releases_count: int = 0
    tags_count: int = 0
    workflows_count: int = 0
    contributors_count: int = 0
    scm_problems_detected: int = 0
