import pytest
from app.services.scm.commit_assistant import synthesize_commit
from app.services.scm.essentials_service import TEMPLATES


def test_synthesize_commit_conventional():
    res = synthesize_commit("fix memory leak in auth provider")
    assert res["type"] == "fix"
    assert res["scope"] == "auth"
    assert "memory leak" in res["subject"]
    assert "git commit -m" in res["git_command"]


def test_synthesize_commit_multi_topic():
    res = synthesize_commit("add login screen and fix navigation bug")
    assert len(res["split_suggestions"]) >= 2
    assert "Atomic change" in res["checklist"][0]


def test_essentials_templates_exist():
    assert ".gitignore" in TEMPLATES
    assert "LICENSE" in TEMPLATES
    assert ".github/workflows/ci.yml" in TEMPLATES
    assert ".github/pull_request_template.md" in TEMPLATES
    assert "CONTRIBUTING.md" in TEMPLATES


def test_analyze_commit_files_heuristic():
    from unittest.mock import patch
    from app.services.scm.commit_assistant import analyze_commit_files_for_assistant

    mock_commit = {
        "commit": {"message": "updated files"},
        "files": [{"filename": "src/components/Login.jsx"}],
        "stats": {"additions": 10, "deletions": 2}
    }
    with patch("app.services.github.client.github_client.get", return_value=mock_commit):
        res = analyze_commit_files_for_assistant("owner/repo", "abcdef123456")
        assert res["scope"] == "auth"
        assert "git commit -m" in res["git_command"]
        assert res["additions"] == 10


def test_fork_status_non_fork_educational():
    from unittest.mock import patch
    from app.services.scm.fork_service import get_fork_status

    mock_repo = {"fork": False, "default_branch": "main"}
    with patch("app.services.github.client.github_client.get", return_value=mock_repo):
        res = get_fork_status("owner/repo")
        assert res["is_fork"] is False
        assert "education" in res
        assert "Standalone Repository" in res["education"]["title"]


def test_risk_analyzer_scoring():
    from app.services.scm.risk_analyzer_service import analyze_repository_risk
    res = analyze_repository_risk("demo/repo")
    assert "health_score" in res
    assert 0 <= res["health_score"] <= 100
    assert "breakdown" in res
    assert "smart_recommendations" in res


def test_release_readiness_audit():
    from app.services.scm.release_readiness_service import audit_release_readiness
    res = audit_release_readiness("demo/repo")
    assert "readiness_percentage" in res
    assert "suggested_version" in res
    assert "generated_changelog" in res
    assert "git_release_command" in res


def test_conflict_predictor():
    from app.services.scm.conflict_predictor_service import predict_merge_conflicts
    res = predict_merge_conflicts("demo/repo", "main", "feature/auth")
    assert "conflict_probability" in res
    assert "risk_level" in res
    assert "conflict_reasons" in res
    assert "hotspots" in res
