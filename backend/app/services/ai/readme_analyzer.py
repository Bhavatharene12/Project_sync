from typing import Any, Dict, List


def analyze_readme(readme_content: str) -> Dict[str, Any]:
    """
    Analyze README documentation completeness and structure.
    Checks for essential SCM documentation sections:
    Installation, Usage, Features, License, Contributing, and length.
    Preserves existing scoring rules and output structure.
    """
    if not readme_content or not isinstance(readme_content, str):
        return {
            "score": 0,
            "status": "README Not Found",
            "strengths": [],
            "improvements": ["Repository has no README."]
        }

    score = 100
    strengths: List[str] = []
    improvements: List[str] = []

    text = readme_content.lower()

    # Installation section check
    if "installation" in text or "install" in text:
        strengths.append("Installation guide available.")
    else:
        score -= 15
        improvements.append("Add an Installation section.")

    # Usage section check
    if "usage" in text:
        strengths.append("Usage section available.")
    else:
        score -= 15
        improvements.append("Add a Usage section.")

    # Features section check
    if "feature" in text or "features" in text:
        strengths.append("Features are documented.")
    else:
        score -= 10
        improvements.append("Describe project features.")

    # License section check
    if "license" in text:
        strengths.append("License information available.")
    else:
        score -= 10
        improvements.append("Include a License section.")

    # Contributing section check
    if "contributing" in text or "contribution" in text:
        strengths.append("Contribution guide available.")
    else:
        score -= 10
        improvements.append("Explain how others can contribute.")

    # README length check
    if len(text) < 1000:
        score -= 10
        improvements.append("README is too short.")

    # Boundary clamp
    if score < 0:
        score = 0

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
        "strengths": strengths,
        "improvements": improvements
    }
