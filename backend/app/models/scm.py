from typing import List, Optional
from pydantic import BaseModel, Field


class SCMProblem(BaseModel):
    """An identified issue or hygiene deviation in source configuration."""
    id: str
    category: str = Field(..., description="e.g. branching, documentation, releases, ci_cd, commits")
    severity: str = Field(..., description="critical, warning, info")
    title: str
    description: str


class SCMRecommendation(BaseModel):
    """An actionable fix recommended for an identified SCM problem."""
    id: str
    problem_id: str
    title: str
    action: str
    rationale: str
    automated: bool = Field(default=False, description="Whether Sync can automate this fix")


class SCMTask(BaseModel):
    """An automated or guided task that can be executed upon approval."""
    id: str
    name: str
    task_type: str = Field(..., description="e.g. generate_readme, branch_cleanup, create_release_notes")
    description: str
    requires_approval: bool = True
    status: str = Field(default="pending", description="pending, approved, running, completed, rejected")


class SCMReport(BaseModel):
    """Comprehensive SCM activity and hygiene audit report."""
    repository: str
    owner: str
    generated_at: str
    health_grade: str
    summary: str
    overall_score: Optional[int] = None
    grade: Optional[str] = None
    grade_capped: bool = False
    cap_reasons: List[str] = Field(default_factory=list)
    problems: List[SCMProblem] = Field(default_factory=list)
    recommendations: List[SCMRecommendation] = Field(default_factory=list)
    available_tasks: List[SCMTask] = Field(default_factory=list)

