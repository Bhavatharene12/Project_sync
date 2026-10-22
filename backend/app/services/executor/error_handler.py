import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException
from app.utils.config import settings

logger = logging.getLogger("sync.executor.error")


def handle_executor_error(
    exc: Exception,
    action_attempted: str,
    token: Optional[str] = None,
    simulation_requested: bool = False,
    simulated_response: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Standardized executor error handler.
    Strictly forbids false success reporting:
    - If GitHub returns an error (401, 403, 404, 409, 422, 429, 500, etc.),
      returns success = False, status = FAILED, verified = False, along with
      the HTTP status code, error message, and action attempted.
    - Only returns a simulated response when simulation mode is explicitly enabled
      or when running in unauthenticated mode without any configured token.
    """
    active_token = token or (settings.GITHUB_TOKEN if settings.has_github_token() else None)

    # Allow simulation only if explicitly requested OR in tokenless unauthenticated local mode
    if (simulation_requested or not active_token) and simulated_response is not None:
        logger.info(f"Using simulated execution response for '{action_attempted}' (no active token or simulation requested).")
        return simulated_response

    # Real execution was attempted with a token and failed: NEVER report success!
    status_code = 500
    error_message = str(exc)

    if isinstance(exc, HTTPException):
        status_code = exc.status_code
        error_message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    elif hasattr(exc, "response") and getattr(exc, "response", None) is not None:
        status_code = getattr(exc.response, "status_code", 500)
        try:
            error_message = exc.response.json().get("message", exc.response.text)
        except Exception:
            error_message = str(exc)

    logger.error(
        f"Real GitHub execution failed for action '{action_attempted}' with HTTP {status_code}: {error_message}"
    )

    return {
        "success": False,
        "status": "FAILED",
        "verified": False,
        "status_code": status_code,
        "error_message": error_message,
        "action_attempted": action_attempted,
        "summary": f"GitHub API error ({status_code}) during {action_attempted}: {error_message}",
        "verification_message": f"Execution failed on GitHub remote ({status_code}): {error_message}"
    }
