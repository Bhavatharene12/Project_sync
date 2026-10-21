from typing import Any, Dict, List


def calculate_health(repo: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate overall repository health based on popularity, community engagement,
    and metadata completeness.
    Preserves existing scoring rules and output structure.
    """
    score = 100
    reasons: List[str] = []

    # Stars evaluation
    stars = repo.get("stargazers_count", 0)
    if stars < 50:
        score -= 25
        reasons.append("Very few stars.")
    elif stars < 500:
        score -= 10
        reasons.append("Repository has limited popularity.")
    else:
        reasons.append("Popular repository.")

    # Open Issues evaluation
    open_issues = repo.get("open_issues_count", 0)
    if open_issues > 100:
        score -= 15
        reasons.append("Large number of open issues.")
    else:
        reasons.append("Issue count is acceptable.")

    # Forks evaluation
    forks = repo.get("forks_count", 0)
    if forks > 100:
        reasons.append("Strong community contributions.")

    # Description evaluation
    if not repo.get("description"):
        score -= 10
        reasons.append("Missing repository description.")

    # Status classification
    if score >= 85:
        health = "Healthy"
    elif score >= 60:
        health = "Needs Attention"
    else:
        health = "Poor"

    return {
        "score": score,
        "health": health,
        "reasons": reasons
    }
