import re
from typing import Any, Dict, List

SEMVER_REGEX = re.compile(r"^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$")


def audit_releases(releases: List[Dict[str, Any]], tags: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Audit software release baselines, semantic versioning tags, and release notes cadence.
    """
    total_releases = len(releases)
    total_tags = len(tags)

    semver_tags = 0
    for t in tags:
        tag_name = t.get("name", "")
        if SEMVER_REGEX.match(tag_name):
            semver_tags += 1

    semver_compliance = round((semver_tags / total_tags * 100), 1) if total_tags > 0 else 0.0

    findings = []
    if total_releases > 0:
        latest = releases[0].get("tag_name", "N/A")
        findings.append(f"Latest formal release: {latest}")
    else:
        findings.append("No formal GitHub releases published.")

    if total_tags > 0 and semver_compliance >= 80:
        findings.append(f"High semantic versioning compliance ({semver_compliance}%).")
    elif total_tags > 0:
        findings.append(f"Mixed version tagging formats detected ({semver_compliance}% SemVer).")
    else:
        findings.append("No git version tags found.")

    return {
        "total_releases": total_releases,
        "total_tags": total_tags,
        "semver_compliance_rate": semver_compliance,
        "status": "Healthy" if total_releases > 0 and semver_compliance >= 70 else "Needs Baseline",
        "findings": findings
    }
