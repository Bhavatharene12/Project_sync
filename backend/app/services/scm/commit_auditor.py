import re
from typing import Any, Dict, List


CONVENTIONAL_COMMIT_REGEX = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?!?: .+"
)


def audit_commits(commits: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Audit commit message conventions, commit velocity, and authorship distribution.
    """
    total = len(commits)
    if total == 0:
        return {
            "total_inspected": 0,
            "conventional_commit_rate": 0.0,
            "distinct_authors": 0,
            "status": "No Commits Found",
            "findings": ["No commit history available for inspection."]
        }

    conventional_count = 0
    authors = set()
    short_messages = 0

    for c in commits:
        commit_info = c.get("commit", {})
        message = commit_info.get("message", "").strip().split("\n")[0]
        author = commit_info.get("author", {}).get("name", "Unknown")
        authors.add(author)

        if CONVENTIONAL_COMMIT_REGEX.match(message):
            conventional_count += 1
        if len(message) < 10:
            short_messages += 1

    rate = round((conventional_count / total) * 100, 1)

    findings = []
    if rate >= 80:
        findings.append(f"Excellent commit hygiene ({rate}% Conventional Commits compliance).")
    elif rate >= 50:
        findings.append(f"Moderate commit consistency ({rate}% Conventional Commits compliance).")
    else:
        findings.append(f"Low commit convention adherence ({rate}% compliance). Consider standardizing.")

    if short_messages > total * 0.3:
        findings.append(f"{short_messages} commits have very short or uninformative messages.")

    return {
        "total_inspected": total,
        "conventional_commit_rate": rate,
        "distinct_authors": len(authors),
        "status": "Healthy" if rate >= 70 else "Needs Improvement",
        "findings": findings
    }
