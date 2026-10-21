import pytest
from app.services.scm import (
    generate_scm_readme,
    generate_branching_strategy,
    generate_release_plan,
    analyze_and_rewrite_commits,
    generate_ci_workflow,
    analyze_change_impact,
)


def test_readme_generator_python():
    repo = {
        "name": "Sync",
        "owner": {"login": "octocat"},
        "description": "An AI SCM Assistant",
        "language": "Python",
        "default_branch": "main",
        "stargazers_count": 100,
        "forks_count": 10,
        "open_issues_count": 2
    }
    result = generate_scm_readme(repo, topics=["scm", "ai", "fastapi"])
    assert result["repository"] == "Sync"
    assert "pip install -r requirements.txt" in result["markdown"]
    assert "pytest -v" in result["markdown"]
    assert "# Sync" in result["markdown"]
    assert len(result["sections_generated"]) > 5


def test_readme_generator_node():
    repo = {
        "name": "SyncUI",
        "owner": {"login": "octocat"},
        "description": "Frontend UI",
        "language": "JavaScript",
        "default_branch": "main",
    }
    result = generate_scm_readme(repo)
    assert "npm install" in result["markdown"]
    assert "npm run dev" in result["markdown"]


def test_branch_strategy_generator():
    branches = [{"name": "main"}]
    result = generate_branching_strategy(branches, default_branch="main")
    assert result["model"] == "GitFlow / Enterprise Trunk Hybrid"
    assert len(result["branches_taxonomy"]) == 5
    assert "gitGraph" in result["mermaid_diagram"]
    assert len(result["action_items"]) > 0


def test_release_plan_generator():
    repo = {"name": "Sync", "owner": {"login": "octocat"}}
    commits = [
        {"sha": "abcdef12345", "commit": {"message": "feat(auth): add JWT", "author": {"name": "Alice"}}},
        {"sha": "1234567890a", "commit": {"message": "fix(db): handle timeout", "author": {"name": "Bob"}}},
        {"sha": "9876543210b", "commit": {"message": "docs(readme): add setup", "author": {"name": "Alice"}}},
    ]
    result = generate_release_plan(repo, commits, existing_releases=[])
    assert result["target_version"] == "v1.0.0"
    assert "## 🚀 New Features" in result["markdown_notes"]
    assert "## 🐛 Bug Fixes" in result["markdown_notes"]
    assert "## 📝 Documentation Improvements" in result["markdown_notes"]
    assert len(result["checklist"]) == 6


def test_commit_assistant_rewriter():
    commits = [
        {"sha": "aaa111", "commit": {"message": "update", "author": {"name": "Alice"}}},
        {"sha": "bbb222", "commit": {"message": "bug fix in api", "author": {"name": "Bob"}}},
        {"sha": "ccc333", "commit": {"message": "feat(core): compliant message", "author": {"name": "Charlie"}}},
    ]
    result = analyze_and_rewrite_commits(commits, "Sync")
    assert result["total_commits"] == 3
    assert result["unstructured_count"] == 2
    assert result["audited_commits"][0]["suggested_rewrite"].startswith("feat")
    assert result["audited_commits"][1]["suggested_rewrite"].startswith("fix")
    assert result["audited_commits"][2]["is_conventional"] is True
    assert "Conventional Commits" in result["guide_markdown"]


def test_workflow_generator():
    repo = {"name": "Sync", "language": "Python", "default_branch": "main"}
    result = generate_ci_workflow(repo, "main")
    assert result["filename"] == "ci-python.yml"
    assert "actions/setup-python@v5" in result["yaml_content"]
    assert "pytest" in result["yaml_content"]


def test_impact_analyzer():
    repo = {"name": "Sync", "language": "Python", "open_issues_count": 10}
    branches = [{"name": "main"}, {"name": "feat/api"}]
    commits = [{"commit": {"message": "feat: test"}}]
    pull_requests = [{"number": 1, "title": "feat: new endpoint"}]

    result = analyze_change_impact(repo, branches, commits, pull_requests)
    assert result["risk_level"] in ("Low", "Medium", "High")
    assert len(result["affected_modules"]) > 0
    assert "merge_conflict_probability" in result
