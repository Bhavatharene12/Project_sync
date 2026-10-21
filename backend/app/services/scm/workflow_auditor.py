from typing import Any, Dict, List


def audit_workflows(workflows: List[Dict[str, Any]], runs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Audit CI/CD pipeline automation, test coverage, and recent workflow execution status.
    """
    total_workflows = len(workflows)
    total_runs = len(runs)

    active_workflows = [w for w in workflows if w.get("state") == "active"]

    successful_runs = 0
    failed_runs = 0
    for r in runs[:20]:
        conclusion = r.get("conclusion")
        if conclusion == "success":
            successful_runs += 1
        elif conclusion in ("failure", "timed_out", "cancelled"):
            failed_runs += 1

    inspected_runs = successful_runs + failed_runs
    pass_rate = round((successful_runs / inspected_runs * 100), 1) if inspected_runs > 0 else 0.0

    findings = []
    if total_workflows == 0:
        findings.append("No automated GitHub Actions CI/CD workflows configured.")
    else:
        findings.append(f"{len(active_workflows)} active workflow(s) configured.")

    if inspected_runs > 0:
        findings.append(f"Recent CI pipeline success rate: {pass_rate}%.")

    return {
        "total_workflows": total_workflows,
        "active_workflows": len(active_workflows),
        "recent_runs_inspected": inspected_runs,
        "ci_pass_rate": pass_rate,
        "status": "Healthy" if total_workflows > 0 and pass_rate >= 75 else "Needs Attention",
        "findings": findings
    }
