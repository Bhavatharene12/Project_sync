from fastapi import APIRouter
from pydantic import BaseModel
import requests
import base64

from app.services.ai_analyzer import calculate_health
from app.services.readme_analyzer import analyze_readme
from app.services.branch_analyzer import analyze_branches

router = APIRouter(prefix="/github", tags=["GitHub"])


class RepositoryRequest(BaseModel):
    url: str


@router.get("/repo")
def get_repository():
    return {
        "repository": "Sync",
        "owner": "Bhava",
        "language": "Python",
        "stars": 25,
        "branches": 12,
        "status": "Healthy"
    }


@router.post("/scan")
def scan_repository(request: RepositoryRequest):

    url = request.url.strip()

    parts = url.rstrip("/").split("/")

    if len(parts) < 5:
        return {
            "success": False,
            "message": "Invalid GitHub Repository URL"
        }

    owner = parts[-2]
    repository = parts[-1]

    # -----------------------------
    # Repository Information
    # -----------------------------

    github_api = f"https://api.github.com/repos/{owner}/{repository}"

    response = requests.get(github_api)

    if response.status_code != 200:
        return {
            "success": False,
            "message": "Repository not found"
        }

    repo = response.json()

    # -----------------------------
    # AI Health
    # -----------------------------

    health_result = calculate_health(repo)

    # -----------------------------
    # README Analysis
    # -----------------------------

    readme_url = f"https://api.github.com/repos/{owner}/{repository}/readme"

    readme_response = requests.get(readme_url)

    if readme_response.status_code == 200:

        encoded = readme_response.json()["content"]

        decoded = base64.b64decode(encoded).decode(
            "utf-8",
            errors="ignore"
        )

        readme_result = analyze_readme(decoded)

    else:

        readme_result = {

            "score": 0,
            "status": "README Not Found",
            "strengths": [],
            "improvements": [
                "Repository has no README."
            ]

        }

    # -----------------------------
    # Branch Analysis
    # -----------------------------

    branches_url = f"https://api.github.com/repos/{owner}/{repository}/branches"

    branches_response = requests.get(branches_url)

    if branches_response.status_code == 200:

        branches = branches_response.json()

        branch_result = analyze_branches(
            branches,
            repo["default_branch"]
        )

    else:

        branch_result = {

            "score": 0,
            "status": "Unavailable",
            "total_branches": 0,
            "strengths": [],
            "suggestions": [
                "Unable to fetch branches."
            ]

        }

    # -----------------------------
    # Final Response
    # -----------------------------

    return {

        "success": True,

        "repository": repo["name"],
        "owner": repo["owner"]["login"],
        "description": repo["description"],
        "language": repo["language"],
        "stars": repo["stargazers_count"],
        "forks": repo["forks_count"],
        "issues": repo["open_issues_count"],
        "default_branch": repo["default_branch"],

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