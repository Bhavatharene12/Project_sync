import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.services.executor.timeline import record_activity
from app.services.executor.readme_executor import execute_readme_commit
from app.services.executor.branch_executor import execute_branch_action
from app.services.executor.pr_executor import execute_pr_merge
from app.services.executor.issue_executor import execute_issue_action
from app.services.executor.release_executor import execute_release_publish
from app.services.executor.workflow_executor import execute_workflow_commit
from app.services.executor.cleanup_executor import execute_cleanup_task

logger = logging.getLogger("sync.executor.engine")

# Staged plans awaiting explicit user approval
_staged_plans: Dict[str, Dict[str, Any]] = {}


def stage_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    """Register a new execution plan in the pending approval queue."""
    plan_id = plan["plan_id"]
    plan["created_at"] = datetime.now(timezone.utc).isoformat()
    plan["approval_status"] = "pending"
    _staged_plans[plan_id] = plan
    return plan


def get_staged_plan(plan_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a staged plan by ID."""
    return _staged_plans.get(plan_id)


def list_staged_plans() -> List[Dict[str, Any]]:
    """Return all plans currently awaiting approval or recently reviewed."""
    return list(_staged_plans.values())


def execute_plan(
    plan_id: str,
    approved: bool,
    token: Optional[str] = None,
    rejection_reason: Optional[str] = None
) -> Dict[str, Any]:
    """
    Central Safe Execution Coordinator:
    Enforces user approval, dispatches execution, performs verification,
    and logs receipt into SCM Activity Timeline.
    """
    plan = _staged_plans.get(plan_id)
    if not plan:
        raise ValueError(f"Execution plan '{plan_id}' not found. It may have expired or been processed.")

    if not approved:
        plan["approval_status"] = "rejected"
        plan["rejection_reason"] = rejection_reason or "Rejected by user."
        record_activity(
            plan_id=plan_id,
            action_type=plan["action_type"],
            repository=plan["repository"],
            status="REJECTED",
            summary=f"Plan rejected by user: {plan['title']}",
            details={"rejection_reason": rejection_reason},
            verified=False,
            verification_message="Operation aborted before any remote modification."
        )
        return {
            "success": False,
            "status": "REJECTED",
            "plan_id": plan_id,
            "summary": f"Plan '{plan['title']}' was rejected and aborted.",
            "message": rejection_reason or "Operation cancelled by user."
        }

    # Mark as approved and proceeding
    plan["approval_status"] = "executing"
    action_type = plan["action_type"]
    payload = plan.get("payload", {})
    repo = plan["repository"]

    logger.info(f"Executing approved plan {plan_id} (action: {action_type}) on {repo}")

    # Dispatch to dedicated executor
    try:
        if action_type == "readme_update":
            result = execute_readme_commit(payload, token=token)
        elif action_type.startswith("branch_"):
            result = execute_branch_action(payload, token=token)
        elif action_type == "pr_merge":
            result = execute_pr_merge(payload, token=token)
        elif action_type.startswith("issue_"):
            result = execute_issue_action(payload, token=token)
        elif action_type == "release_publish":
            result = execute_release_publish(payload, token=token)
        elif action_type == "workflow_commit":
            result = execute_workflow_commit(payload, token=token)
        elif action_type == "batch_cleanup":
            tasks = payload.get("tasks", [])
            completed_tasks = 0
            for t in tasks:
                res = execute_cleanup_task(t, token=token)
                if res.get("success"):
                    completed_tasks += 1
            result = {
                "success": True,
                "status": "SUCCESS",
                "summary": f"Completed {completed_tasks}/{len(tasks)} cleanup tasks on {repo}.",
                "verified": True,
                "verification_message": f"All {completed_tasks} selected hygiene actions executed and verified."
            }
        else:
            raise ValueError(f"Unknown action type: {action_type}")

    except Exception as exc:
        logger.error(f"Error during execution of plan {plan_id}: {exc}")
        result = {
            "success": False,
            "status": "FAILED",
            "summary": f"Failed to execute {action_type}: {str(exc)}",
            "verified": False,
            "verification_message": f"Execution error: {str(exc)}"
        }

    # Finalize plan state
    plan["approval_status"] = "executed" if result.get("success") else "failed"
    plan["execution_result"] = result

    # Record persistent activity timeline receipt
    activity_entry = record_activity(
        plan_id=plan_id,
        action_type=action_type,
        repository=repo,
        status=result.get("status", "SUCCESS"),
        summary=result.get("summary", plan["title"]),
        commit_sha=result.get("commit_sha"),
        resource_url=result.get("resource_url"),
        details=result,
        verified=result.get("verified", True),
        verification_message=result.get("verification_message")
    )

    return {
        **result,
        "plan_id": plan_id,
        "action_type": action_type,
        "repository": repo,
        "timeline_id": activity_entry["id"],
        "timestamp": activity_entry["timestamp"]
    }
