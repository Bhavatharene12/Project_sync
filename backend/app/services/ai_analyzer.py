def calculate_health(repo):

    score = 100
    reasons = []

    # Stars

    if repo["stargazers_count"] < 50:
        score -= 25
        reasons.append("Very few stars.")

    elif repo["stargazers_count"] < 500:
        score -= 10
        reasons.append("Repository has limited popularity.")

    else:
        reasons.append("Popular repository.")

    # Open Issues

    if repo["open_issues_count"] > 100:
        score -= 15
        reasons.append("Large number of open issues.")

    else:
        reasons.append("Issue count is acceptable.")

    # Forks

    if repo["forks_count"] > 100:
        reasons.append("Strong community contributions.")

    # Description

    if repo["description"] is None:
        score -= 10
        reasons.append("Missing repository description.")

    # Final Health

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