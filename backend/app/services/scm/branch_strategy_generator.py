from typing import Any, Dict, List


def generate_branching_strategy(
    current_branches: List[Dict[str, Any]],
    default_branch: str = "main"
) -> Dict[str, Any]:
    """
    Generate an enterprise SCM branching model tailored to the repository's current structure.
    Defines branch taxonomy, lifecycle rules, merge policies, and visual workflow diagrams.
    """
    branch_names = [b.get("name", "") for b in current_branches]
    has_develop = "develop" in branch_names or "dev" in branch_names
    has_main = default_branch == "main" or "main" in branch_names

    strategy_model = "GitFlow / Enterprise Trunk Hybrid"

    branches_taxonomy = [
        {
            "name": "main",
            "role": "Production Baseline",
            "access": "Protected (Release Managers only via PR)",
            "purpose": "Always reflects deployed production state. Every commit on main is tagged with a semantic release.",
            "merge_strategy": "Squash & Merge or Rebase (No direct commits)"
        },
        {
            "name": "develop",
            "role": "Integration Baseline",
            "access": "Protected (Developers via PR with CI passing)",
            "purpose": "Primary integration hub where completed features converge before preparing a release candidate.",
            "merge_strategy": "Create a merge commit (Preserve feature history)"
        },
        {
            "name": "feature/* (or feat/*)",
            "role": "Active Feature Development",
            "access": "Feature authors & contributors",
            "purpose": "Branch off develop. Used for all new feature development and refactoring. Isolated from production.",
            "merge_strategy": "Squash merge into develop upon review approval"
        },
        {
            "name": "release/*",
            "role": "Release Candidate Stabilization",
            "access": "Release Engineers / QA",
            "purpose": "Branch off develop when milestone features are ready. Only bug fixes, doc updates, and release prep are committed here.",
            "merge_strategy": "Merge into main (with tag) and back-merge into develop"
        },
        {
            "name": "hotfix/*",
            "role": "Emergency Production Patching",
            "access": "On-call SCM / Lead Developers",
            "purpose": "Branch directly off main to resolve urgent production incidents without waiting for the next feature release.",
            "merge_strategy": "Merge into main (new patch tag) AND back-merge into develop"
        }
    ]

    # Mermaid diagram representing branch lifecycle
    mermaid_diagram = """gitGraph
    commit id: "v1.0.0" tag: "v1.0.0"
    branch develop
    checkout develop
    commit id: "init dev"
    branch feat/auth
    checkout feat/auth
    commit id: "feat: JWT login"
    commit id: "feat: refresh token"
    checkout develop
    merge feat/auth id: "Merge PR #1"
    branch release/v1.1.0
    checkout release/v1.1.0
    commit id: "docs: bump version"
    checkout main
    merge release/v1.1.0 id: "v1.1.0" tag: "v1.1.0"
    checkout develop
    merge release/v1.1.0 id: "back-merge v1.1.0"
    checkout main
    branch hotfix/auth-leak
    checkout hotfix/auth-leak
    commit id: "fix: revoke token"
    checkout main
    merge hotfix/auth-leak id: "v1.1.1" tag: "v1.1.1"
    checkout develop
    merge hotfix/auth-leak id: "back-merge fix"
"""

    action_items = []
    if not has_develop:
        action_items.append({
            "command": "git checkout -b develop && git push origin develop",
            "action": "Create Integration Branch ('develop')",
            "priority": "High",
            "rationale": "Prevents ongoing unverified feature work from cluttering the production main branch."
        })
    if default_branch != "main":
        action_items.append({
            "command": f"git branch -m {default_branch} main && git push -u origin main",
            "action": "Rename Default Branch to 'main'",
            "priority": "Medium",
            "rationale": "Conforms with modern Git and GitHub industry standard defaults."
        })

    action_items.append({
        "command": "gh api --method PUT /repos/:owner/:repo/branches/main/protection",
        "action": "Enforce Branch Protection on 'main'",
        "priority": "Critical",
        "rationale": "Enforces required code reviews, passing CI status checks, and blocks force pushes."
    })

    markdown_guide = f"""# SCM Branching Strategy & Lifecycle Policy

## 🎯 Model Overview: {strategy_model}
This repository is configured to follow an enterprise-grade SCM branching strategy designed to prevent production regression, guarantee code review traceability, and streamline parallel developer velocity.

---

## 🌿 Branch Taxonomy & Responsibilities

| Branch Pattern | Role & Purpose | Who Works Here | Merge Strategy |
| :--- | :--- | :--- | :--- |
| `main` | Production Baseline (Tagged Releases) | Release Managers / Leads | Merge Commit from `release/*` or `hotfix/*` |
| `develop` | Integration Baseline for Next Release | All Engineers (via PR) | Squash & Merge from `feat/*` |
| `feat/*` | Feature & Capability Development | Individual Contributors | Squash & Merge into `develop` |
| `release/*` | Release Candidate Hardening & QA | Release Engineers / QA | Merge into `main` + Back-merge to `develop` |
| `hotfix/*` | Urgent Production Defect Mitigation | Emergency SCM Leads | Merge into `main` + Back-merge to `develop` |

---

## 🔄 Branch Lifecycle & Merge Workflow

```mermaid
{mermaid_diagram}
```

### 1. Feature Lifecycle
1. Branch off `develop`: `git checkout develop && git pull && git checkout -b feat/user-auth`
2. Commit small, testable Conventional Commits.
3. Open a Pull Request targeting `develop`.
4. Peer approval + green CI pipeline required.
5. Squash and merge into `develop`, delete feature branch.

### 2. Release Lifecycle
1. Branch off `develop`: `git checkout -b release/v1.2.0`
2. Freeze feature merges. Perform QA, version bump, and release note compilation.
3. Merge `release/v1.2.0` into `main` and tag `v1.2.0`.
4. Back-merge `release/v1.2.0` into `develop` so any stabilization fixes are preserved.

### 3. Emergency Hotfix Lifecycle
1. Branch off `main`: `git checkout -b hotfix/critical-security-patch`
2. Apply minimal targeted fix and verify regression tests.
3. Merge directly into `main` and tag patch release (e.g., `v1.2.1`).
4. Immediately back-merge into `develop`.

---

## 🛡️ Recommended Branch Protection Rules for `main`
- [x] Require a pull request before merging (minimum 1 approval).
- [x] Require status checks to pass before merging (CI test suite).
- [x] Do not allow bypassing the above settings.
- [x] Enforce linear history / squash merging.
- [x] Disallow force pushes and deletions.
"""

    return {
        "model": strategy_model,
        "branches_taxonomy": branches_taxonomy,
        "mermaid_diagram": mermaid_diagram,
        "action_items": action_items,
        "markdown_guide": markdown_guide.strip(),
        "current_branches_inspected": branch_names
    }
