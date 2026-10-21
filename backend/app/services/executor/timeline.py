import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("sync.executor.timeline")

# Local storage path for audit timeline persistence
_data_dir = Path(__file__).resolve().parent.parent.parent.parent / ".sync_data"
_timeline_file = _data_dir / "scm_activity_timeline.json"

# In-memory cache
_memory_timeline: List[Dict[str, Any]] = []


def _ensure_storage():
    """Ensure data directory and timeline file exist."""
    try:
        _data_dir.mkdir(parents=True, exist_ok=True)
        if not _timeline_file.exists():
            _timeline_file.write_text("[]", encoding="utf-8")
    except Exception as exc:
        logger.warning(f"Unable to initialize timeline storage file: {exc}")


def load_timeline() -> List[Dict[str, Any]]:
    """Load activity timeline entries from persistent storage."""
    global _memory_timeline
    _ensure_storage()
    if _timeline_file.exists():
        try:
            content = _timeline_file.read_text(encoding="utf-8")
            _memory_timeline = json.loads(content)
            return _memory_timeline
        except Exception as exc:
            logger.warning(f"Error reading timeline file: {exc}")
    return _memory_timeline


def record_activity(
    plan_id: str,
    action_type: str,
    repository: str,
    status: str,
    summary: str,
    commit_sha: Optional[str] = None,
    resource_url: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    verified: bool = True,
    verification_message: Optional[str] = None,
    operator: str = "Sync AI SCM Assistant"
) -> Dict[str, Any]:
    """
    Append an executed SCM operation receipt to the persistent audit timeline.
    """
    global _memory_timeline
    _ensure_storage()

    entry = {
        "id": f"ACT-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "plan_id": plan_id,
        "action_type": action_type,
        "repository": repository,
        "status": status,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "commit_sha": commit_sha,
        "resource_url": resource_url,
        "details": details or {},
        "verified": verified,
        "verification_message": verification_message,
        "operator": operator,
    }

    _memory_timeline.insert(0, entry)
    # Retain the last 150 operations
    _memory_timeline = _memory_timeline[:150]

    try:
        _timeline_file.write_text(json.dumps(_memory_timeline, indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning(f"Could not write timeline to disk: {exc}")

    return entry


def clear_timeline():
    """Clear all timeline records."""
    global _memory_timeline
    _memory_timeline = []
    _ensure_storage()
    try:
        _timeline_file.write_text("[]", encoding="utf-8")
    except Exception as exc:
        logger.warning(f"Could not clear timeline file: {exc}")
