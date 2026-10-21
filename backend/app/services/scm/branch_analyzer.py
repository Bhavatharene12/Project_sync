from typing import Any, Dict, List


def analyze_branches(branches: List[Dict[str, Any]], default_branch: str) -> Dict[str, Any]:
    """
    Analyze repository branch structure.
    Preserves exact scoring algorithm, keys, and return contract for backward compatibility.
    """
    total = len(branches) if isinstance(branches, list) else 0

    score = 100
    strengths: List[str] = []
    suggestions: List[str] = []

    # Number of branches evaluation
    if total == 1:
        score -= 25
        suggestions.append("Only one branch detected. Consider feature branches.")
    elif total < 5:
        score -= 10
        suggestions.append("Repository has only a few branches.")
    else:
        strengths.append("Repository uses multiple branches.")

    # Default branch evaluation
    if default_branch == "main":
        strengths.append("Uses 'main' as default branch.")
    else:
        suggestions.append("Default branch is not 'main'.")

    # Status classification
    if score >= 85:
        status = "Excellent"
    elif score >= 70:
        status = "Good"
    elif score >= 50:
        status = "Average"
    else:
        status = "Poor"

    return {
        "score": score,
        "status": status,
        "total_branches": total,
        "strengths": strengths,
        "suggestions": suggestions
    }


def audit_branch_hygiene(branches: List[Dict[str, Any]], default_branch: str) -> Dict[str, Any]:
    """
    Extended SCM branch hygiene audit.
    Evaluates branch protection, naming patterns, and active workstreams.
    """
    base_result = analyze_branches(branches, default_branch)

    protected_count = 0
    feature_branches = 0
    bugfix_branches = 0

    for b in branches:
        name = b.get("name", "").lower()
        if b.get("protected"):
            protected_count += 1
        if name.startswith("feat/") or name.startswith("feature/"):
            feature_branches += 1
        elif name.startswith("fix/") or name.startswith("bugfix/"):
            bugfix_branches += 1

    return {
        **base_result,
        "protected_branches_count": protected_count,
        "feature_branches_count": feature_branches,
        "bugfix_branches_count": bugfix_branches,
    }
