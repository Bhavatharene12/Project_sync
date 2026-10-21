import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import requests
from fastapi import HTTPException

from app.utils.config import settings

logger = logging.getLogger("sync.github.client")


class GitHubClient:
    """
    Centralized HTTP client for GitHub REST API v3.
    Supports authenticated and unauthenticated requests with automatic
    header injection, rate limit handling, and structured error responses.
    """

    def __init__(self):
        self.base_url = settings.GITHUB_API_BASE_URL.rstrip("/")
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def _get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """Construct request headers with authentication token if present."""
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Sync-AI-SCM-Assistant/1.0",
        }
        active_token = token or (settings.GITHUB_TOKEN if settings.has_github_token() else None)
        if active_token:
            headers["Authorization"] = f"Bearer {active_token}"
        return headers

    def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Any] = None,
        data: Optional[Any] = None,
        allow_404: bool = False,
        token: Optional[str] = None,
        return_response_object: bool = False
    ) -> Optional[Any]:
        """
        Execute an arbitrary HTTP request against GitHub REST API v3.
        """
        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            url = endpoint
        else:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"

        headers = self._get_headers(token=token)

        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                data=data,
                timeout=self.timeout
            )
        except requests.exceptions.Timeout:
            logger.error(f"GitHub API timeout accessing {url}")
            raise HTTPException(
                status_code=504,
                detail="GitHub API request timed out. Please try again."
            )
        except requests.exceptions.ConnectionError:
            logger.error(f"GitHub API connection failure to {url}")
            raise HTTPException(
                status_code=502,
                detail="Could not establish connection to GitHub API. Please check your network."
            )
        except requests.exceptions.RequestException as exc:
            logger.error(f"Unexpected error calling GitHub API {url}: {exc}")
            raise HTTPException(
                status_code=500,
                detail=f"Error communicating with GitHub API: {str(exc)}"
            )

        if return_response_object:
            return response

        return self._handle_response(response, url, allow_404)

    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        allow_404: bool = False,
        token: Optional[str] = None
    ) -> Optional[Any]:
        """Execute an HTTP GET request to the GitHub REST API."""
        return self.request("GET", endpoint, params=params, allow_404=allow_404, token=token)

    def post(
        self,
        endpoint: str,
        json_data: Optional[Any] = None,
        data: Optional[Any] = None,
        token: Optional[str] = None
    ) -> Optional[Any]:
        """Execute an HTTP POST request to the GitHub REST API."""
        return self.request("POST", endpoint, json_data=json_data, data=data, token=token)

    def put(
        self,
        endpoint: str,
        json_data: Optional[Any] = None,
        data: Optional[Any] = None,
        token: Optional[str] = None
    ) -> Optional[Any]:
        """Execute an HTTP PUT request to the GitHub REST API."""
        return self.request("PUT", endpoint, json_data=json_data, data=data, token=token)

    def patch(
        self,
        endpoint: str,
        json_data: Optional[Any] = None,
        data: Optional[Any] = None,
        token: Optional[str] = None
    ) -> Optional[Any]:
        """Execute an HTTP PATCH request to the GitHub REST API."""
        return self.request("PATCH", endpoint, json_data=json_data, data=data, token=token)

    def delete(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None
    ) -> Optional[Any]:
        """Execute an HTTP DELETE request to the GitHub REST API."""
        return self.request("DELETE", endpoint, params=params, token=token)

    def _handle_response(self, response: requests.Response, url: str, allow_404: bool) -> Optional[Any]:
        """Inspect HTTP status codes, check rate limits, and format payload or exceptions."""
        status_code = response.status_code

        # Rate Limit Inspection
        remaining = response.headers.get("x-ratelimit-remaining")
        reset_epoch = response.headers.get("x-ratelimit-reset")

        if status_code in (403, 429) and remaining == "0":
            reset_msg = ""
            if reset_epoch:
                try:
                    reset_dt = datetime.fromtimestamp(int(reset_epoch), tz=timezone.utc)
                    reset_msg = f" Rate limit will reset at {reset_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}."
                except Exception:
                    pass

            token_advice = (
                "You are using unauthenticated requests (max 60/hr). "
                "Set a GITHUB_TOKEN in backend/.env to increase limit to 5,000 req/hr."
                if not settings.has_github_token()
                else "Your configured GITHUB_TOKEN has exhausted its rate limit."
            )

            raise HTTPException(
                status_code=429,
                detail=f"GitHub API rate limit exceeded.{reset_msg} {token_advice}"
            )

        # 200 OK / 201 Created
        if 200 <= status_code < 300:
            if not response.content:
                return {}
            try:
                return response.json()
            except Exception:
                return response.text

        # 404 Not Found
        if status_code == 404:
            if allow_404:
                return None
            raise HTTPException(
                status_code=404,
                detail=f"Requested GitHub resource not found: {url}"
            )

        # 401 Unauthorized
        if status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub authentication failed. Please verify your GITHUB_TOKEN in backend/.env."
            )

        # 403 Forbidden (other than rate limit, e.g. permissions)
        if status_code == 403:
            msg = response.json().get("message", "Forbidden") if response.content else "Forbidden"
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden by GitHub: {msg}"
            )

        # Upstream 5xx
        if status_code >= 500:
            raise HTTPException(
                status_code=502,
                detail="GitHub API returned an upstream server error. Please try again later."
            )

        # Fallback generic client error
        error_detail = response.text
        try:
            error_detail = response.json().get("message", response.text)
        except Exception:
            pass

        raise HTTPException(
            status_code=status_code,
            detail=f"GitHub API error ({status_code}): {error_detail}"
        )


# Global singleton instance
github_client = GitHubClient()
