from typing import Any, Dict, List
from app.models.scm import SCMProblem, SCMRecommendation, SCMTask


def generate_scm_recommendations(
    repo_data: Dict[str, Any],
    readme_result: Dict[str, Any],
    branch_result: Dict[str, Any],
    commits: List[Dict[str, Any]],
    pull_requests: List[Dict[str, Any]],
    releases: List[Dict[str, Any]],
    workflows: List[Dict[str, Any]],
) -> tuple[List[SCMProblem], List[SCMRecommendation], List[SCMTask]]:
    """
    Synthesize repository analysis into detected SCM problems, prioritized recommendations,
    and executable tasks that can be performed upon user approval.
    """
    problems: List[SCMProblem] = []
    recommendations: List[SCMRecommendation] = []
    tasks: List[SCMTask] = []

    # 1. README / Documentation Analysis
    if readme_result.get("score", 0) < 70:
        problems.append(
            SCMProblem(
                id="PROB-DOC-01",
                category="documentation",
                severity="warning" if readme_result.get("score", 0) >= 50 else "critical",
                title="Substandard README Documentation",
                description=f"README scored {readme_result.get('score')}%. Missing: {', '.join(readme_result.get('improvements', []))}"
            )
        )
        recommendations.append(
            SCMRecommendation(
                id="REC-DOC-01",
                problem_id="PROB-DOC-01",
                title="Generate Standardized README with Project Sections",
                action="Scaffold missing installation, usage, and contribution sections.",
                rationale="Comprehensive documentation decreases onboarding time and prevents issue sprawl.",
                automated=True
            )
        )
        tasks.append(
            SCMTask(
                id="TASK-DOC-01",
                name="Generate AI README Draft",
                task_type="generate_readme",
                description="Auto-generate a complete README template populated with detected repository language and metadata.",
                requires_approval=True
            )
        )

    # 2. Branch Hygiene Analysis
    if branch_result.get("total_branches", 0) == 1:
        problems.append(
            SCMProblem(
                id="PROB-BR-01",
                category="branching",
                severity="warning",
                title="Single Branch Architecture",
                description="All development is directed into the default branch without feature or release branching."
            )
        )
        recommendations.append(
            SCMRecommendation(
                id="REC-BR-01",
                problem_id="PROB-BR-01",
                title="Adopt Feature-Branch Workflow",
                action="Configure branch protection rules and isolate feature work into topic branches.",
                rationale="Prevents accidental direct commits to production and enables code review.",
                automated=False
            )
        )

    if branch_result.get("status") == "Poor":
        problems.append(
            SCMProblem(
                id="PROB-BR-02",
                category="branching",
                severity="warning",
                title="Branch Strategy Deviations",
                description="Branch hygiene does not conform to standard conventions."
            )
        )

    # 3. CI/CD / GitHub Actions Workflows Analysis
    if not workflows:
        problems.append(
            SCMProblem(
                id="PROB-CI-01",
                category="ci_cd",
                severity="warning",
                title="No CI/CD Automation Configured",
                description="No GitHub Actions workflows were found for automated testing, linting, or builds."
            )
        )
        recommendations.append(
            SCMRecommendation(
                id="REC-CI-01",
                problem_id="PROB-CI-01",
                title="Set Up Automated CI Workflow",
                action=f"Generate a GitHub Actions workflow template tailored for {repo_data.get('language', 'your project')}.",
                rationale="Continuous Integration ensures code quality and catches regression before merge.",
                automated=True
            )
        )
        tasks.append(
            SCMTask(
                id="TASK-CI-01",
                name="Scaffold GitHub Actions CI Workflow",
                task_type="scaffold_ci_workflow",
                description="Create a .github/workflows/ci.yml configuration file for automated tests.",
                requires_approval=True
            )
        )

    # 4. Release Management Analysis
    if not releases:
        problems.append(
            SCMProblem(
                id="PROB-REL-01",
                category="releases",
                severity="info",
                title="No Formal Semantic Releases",
                description="No published GitHub releases or version tags found for software baseline tracking."
            )
        )
        recommendations.append(
            SCMRecommendation(
                id="REC-REL-01",
                problem_id="PROB-REL-01",
                title="Establish Semantic Versioning Release Milestones",
                action="Publish formal releases and automated changelogs from commits.",
                rationale="Software Configuration Management requires distinct version baselines for traceability.",
                automated=True
            )
        )
        tasks.append(
            SCMTask(
                id="TASK-REL-01",
                name="Generate Release Notes & Tag Baseline",
                task_type="create_release_notes",
                description="Extract recent commit history into categorized release notes (features, bug fixes, breaking changes).",
                requires_approval=True
            )
        )

    # 5. Commit Conventions Analysis
    if commits:
        conventional_prefixes = ("feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "build", "ci")
        non_conforming = 0
        for c in commits[:15]:
            msg = c.get("commit", {}).get("message", "").strip().lower()
            if not any(msg.startswith(prefix) for prefix in conventional_prefixes):
                non_conforming += 1

        if non_conforming > len(commits[:15]) * 0.6:
            problems.append(
                SCMProblem(
                    id="PROB-CMT-01",
                    category="commits",
                    severity="info",
                    title="Inconsistent Commit Message Conventions",
                    description="The majority of recent commits do not follow Conventional Commits formatting."
                )
            )
            recommendations.append(
                SCMRecommendation(
                    id="REC-CMT-01",
                    problem_id="PROB-CMT-01",
                    title="Adopt Conventional Commits Standard",
                    action="Enforce commit formatting guidelines (feat:, fix:, chore:, docs:).",
                    rationale="Standardized commits enable automated changelog generation and clear versioning.",
                    automated=False
                )
            )

    return problems, recommendations, tasks
