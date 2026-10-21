def analyze_branches(branches, default_branch):

    total = len(branches)

    score = 100

    strengths = []

    suggestions = []

    # Number of branches

    if total == 1:
        score -= 25
        suggestions.append(
            "Only one branch detected. Consider feature branches."
        )

    elif total < 5:
        score -= 10
        suggestions.append(
            "Repository has only a few branches."
        )

    else:
        strengths.append(
            "Repository uses multiple branches."
        )

    # Default branch

    if default_branch == "main":

        strengths.append(
            "Uses 'main' as default branch."
        )

    else:

        suggestions.append(
            "Default branch is not 'main'."
        )

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