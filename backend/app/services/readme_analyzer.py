import base64


def analyze_readme(readme_content):

    score = 100

    strengths = []
    improvements = []

    text = readme_content.lower()

    # Installation

    if "installation" in text or "install" in text:
        strengths.append("Installation guide available.")
    else:
        score -= 15
        improvements.append("Add an Installation section.")

    # Usage

    if "usage" in text:
        strengths.append("Usage section available.")
    else:
        score -= 15
        improvements.append("Add a Usage section.")

    # Features

    if "feature" in text or "features" in text:
        strengths.append("Features are documented.")
    else:
        score -= 10
        improvements.append("Describe project features.")

    # License

    if "license" in text:
        strengths.append("License information available.")
    else:
        score -= 10
        improvements.append("Include a License section.")

    # Contributing

    if "contributing" in text or "contribution" in text:
        strengths.append("Contribution guide available.")
    else:
        score -= 10
        improvements.append("Explain how others can contribute.")

    # README length

    if len(text) < 1000:
        score -= 10
        improvements.append("README is too short.")

    if score < 0:
        score = 0

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
        "strengths": strengths,
        "improvements": improvements
    }