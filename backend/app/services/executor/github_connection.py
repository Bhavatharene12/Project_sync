import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.services.github.client import github_client
from app.utils.config import settings

logger = logging.getLogger("sync.executor.connection")


def verify_connection(token: Optional[str] = None) -> Dict[str, Any]:
    """
    Verify GitHub Personal Access Token authentication, detect scopes,
    check rate limits, and list accessible repositories.
    """
    active_token = token or (settings.GITHUB_TOKEN if settings.has_github_token() else None)

    if not active_token:
        # Unauthenticated / local mode
        return {
            "authenticated": False,
            "user": None,
            "scopes": [],
            "has_repo_scope": False,
            "has_workflow_scope": False,
            "rate_limit": {
                "limit": 60,
                "remaining": 60,
                "reset": 0,
                "reset_time": None,
                "used": 0
            },
            "repositories": [],
            "message": "No GitHub Personal Access Token provided. Operations will run in simulation mode or require an authorized PAT."
        }

    try:
        # 1. Fetch authenticated user details and inspection headers
        resp = github_client.request(
            method="GET",
            endpoint="/user",
            token=active_token,
            return_response_object=True
        )

        if resp.status_code != 200:
            return {
                "authenticated": False,
                "user": None,
                "scopes": [],
                "has_repo_scope": False,
                "has_workflow_scope": False,
                "rate_limit": {"limit": 60, "remaining": 0, "reset": 0, "reset_time": None, "used": 60},
                "repositories": [],
                "message": f"GitHub token validation failed with status {resp.status_code}."
            }

        user_data = resp.json()

        # 2. Extract OAuth scopes from header
        raw_scopes = resp.headers.get("x-oauth-scopes", "")
        scopes = [s.strip() for s in raw_scopes.split(",") if s.strip()] if raw_scopes else []

        has_repo_scope = any(s in scopes for s in ["repo", "public_repo"])
        has_workflow_scope = "workflow" in scopes or "repo" in scopes

        # 3. Extract rate limit info
        limit_val = int(resp.headers.get("x-ratelimit-limit", 5000))
        rem_val = int(resp.headers.get("x-ratelimit-remaining", 5000))
        reset_val = int(resp.headers.get("x-ratelimit-reset", 0))
        reset_time_str = None
        if reset_val:
            try:
                reset_time_str = datetime.fromtimestamp(reset_val, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            except Exception:
                pass

        rate_limit_info = {
            "limit": limit_val,
            "remaining": rem_val,
            "reset": reset_val,
            "reset_time": reset_time_str,
            "used": limit_val - rem_val
        }

        # 4. Fetch repositories accessible to this token
        repositories: List[Dict[str, Any]] = []
        try:
            repos_data = github_client.get(
                "/user/repos",
                params={"sort": "updated", "per_page": 50, "affiliation": "owner,collaborator"},
                token=active_token
            )
            if isinstance(repos_data, list):
                for r in repos_data:
                    repositories.append({
                        "name": r.get("name"),
                        "full_name": r.get("full_name"),
                        "owner": r.get("owner", {}).get("login"),
                        "private": r.get("private", False),
                        "description": r.get("description"),
                        "default_branch": r.get("default_branch", "main"),
                        "stars": r.get("stargazers_count", 0),
                        "forks": r.get("forks_count", 0),
                        "open_issues": r.get("open_issues_count", 0),
                        "html_url": r.get("html_url"),
                        "permissions": r.get("permissions", {})
                    })
        except Exception as exc:
            logger.warning(f"Could not fetch user repositories: {exc}")

        return {
            "authenticated": True,
            "user": {
                "login": user_data.get("login"),
                "id": user_data.get("id"),
                "avatar_url": user_data.get("avatar_url"),
                "html_url": user_data.get("html_url"),
                "name": user_data.get("name") or user_data.get("login"),
                "email": user_data.get("email"),
                "public_repos": user_data.get("public_repos", 0),
                "total_private_repos": user_data.get("total_private_repos", 0),
                "plan": user_data.get("plan", {}).get("name", "free")
            },
            "scopes": scopes,
            "has_repo_scope": has_repo_scope,
            "has_workflow_scope": has_workflow_scope,
            "rate_limit": rate_limit_info,
            "repositories": repositories,
            "message": f"Successfully connected as @{user_data.get('login')}. {len(repositories)} repositories available."
        }

    except Exception as exc:
        logger.error(f"Error during GitHub connection verification: {exc}")
        # Return fallback simulation structure if offline / mock
        return {
            "authenticated": False,
            "user": None,
            "scopes": [],
            "has_repo_scope": False,
            "has_workflow_scope": False,
            "rate_limit": {
                "limit": 60,
                "remaining": 60,
                "reset": 0,
                "reset_time": None,
                "used": 0
            },
            "repositories": [],
            "message": f"Connection check failed: {str(exc)}"
        }
