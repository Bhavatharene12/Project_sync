from typing import Any, Dict, List


def analyze_change_impact(
    repo_data: Dict[str, Any],
    branches: List[Dict[str, Any]],
    commits: List[Dict[str, Any]],
    pull_requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Perform SCM Change Impact Analysis.
    Assesses repository volatility, module sensitivity, merge conflict risk,
    and dependency surface area.
    """
    language = repo_data.get("language") or "Python"
    open_issues = repo_data.get("open_issues_count", 0)
    open_prs = len(pull_requests)
    branch_count = len(branches)
    recent_commits_count = len(commits)

    # 1. Determine overall risk level
    risk_score = 0
    risk_factors = []

    if open_prs > 5:
        risk_score += 30
        risk_factors.append(f"{open_prs} concurrent open pull requests increase branch drift.")
    elif open_prs > 1:
        risk_score += 15
        risk_factors.append("Multiple concurrent active pull requests.")

    if branch_count > 10:
        risk_score += 25
        risk_factors.append("High branch sprawl detected without automated pruning.")
    elif branch_count == 1:
        risk_score += 20
        risk_factors.append("Single branch without staging increases production blast radius.")

    if open_issues > 50:
        risk_score += 20
        risk_factors.append("High issue backlog suggests unmitigated defect accumulation.")

    if recent_commits_count > 25:
        risk_score += 15
        risk_factors.append("High commit frequency indicates rapid ongoing code volatility.")

    if risk_score >= 60:
        risk_level = "High"
    elif risk_score >= 35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # 2. Merge conflict probability
    if open_prs >= 4 or branch_count > 8:
        conflict_prob = 68
        conflict_assessment = "Moderate to High risk of concurrent file collisions."
    elif open_prs >= 2:
        conflict_prob = 35
        conflict_assessment = "Low to Moderate risk of merge collision on core entrypoints."
    else:
        conflict_prob = 12
        conflict_assessment = "Low risk. Minimal concurrent branch divergence."

    # 3. Affected modules & likely impacted files based on tech stack
    lang_lower = language.lower()
    if "python" in lang_lower:
        modules = [
            {"module": "API & Route Handlers", "sensitivity": "High", "files": ["app/routes/*.py", "app/main.py"], "risk": "Medium"},
            {"module": "Core Business Services", "sensitivity": "Critical", "files": ["app/services/*.py"], "risk": "High"},
            {"module": "Data Models & Schemas", "sensitivity": "Medium", "files": ["app/models/*.py"], "risk": "Low"},
            {"module": "Environment & Config", "sensitivity": "High", "files": ["requirements.txt", ".env"], "risk": "Medium"},
        ]
        deps_summary = "pip / requirements.txt dependency graph"
    elif "javascript" in lang_lower or "typescript" in lang_lower or "react" in lang_lower:
        modules = [
            {"module": "UI Routing & App Shell", "sensitivity": "High", "files": ["src/App.jsx", "src/main.jsx"], "risk": "Medium"},
            {"module": "Shared Components", "sensitivity": "Critical", "files": ["src/components/*"], "risk": "High"},
            {"module": "API Client Layer", "sensitivity": "High", "files": ["src/api/*.js"], "risk": "Medium"},
            {"module": "Package Dependencies", "sensitivity": "High", "files": ["package.json", "package-lock.json"], "risk": "High"},
        ]
        deps_summary = "npm / node_modules dependency graph"
    else:
        modules = [
            {"module": "Core Runtime", "sensitivity": "Critical", "files": ["src/*", "main.*"], "risk": "High"},
            {"module": "Build & Configuration", "sensitivity": "High", "files": ["config/*", "build.*"], "risk": "Medium"},
            {"module": "Test Suites", "sensitivity": "Medium", "files": ["tests/*", "spec/*"], "risk": "Low"},
        ]
        deps_summary = f"{language} project dependency manifest"

    return {
        "risk_level": risk_level,
        "risk_score": min(risk_score, 100),
        "merge_conflict_probability": conflict_prob,
        "conflict_assessment": conflict_assessment,
        "risk_factors": risk_factors or ["Repository maintains steady commit cadence and low concurrent PR sprawl."],
        "affected_modules": modules,
        "dependencies_summary": deps_summary,
        "recommendation": (
            "Adopt feature branch isolation and mandate squash-merging to prevent conflict sprawl."
            if risk_level != "Low"
            else "Current repository volatility is within safe SCM thresholds."
        )
    }
