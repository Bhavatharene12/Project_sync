import pytest
from fastapi import HTTPException
from app.utils.url_parser import parse_github_url


def test_standard_https_url():
    owner, repo = parse_github_url("https://github.com/octocat/Hello-World")
    assert owner == "octocat"
    assert repo == "Hello-World"


def test_http_url():
    owner, repo = parse_github_url("http://github.com/psf/requests")
    assert owner == "psf"
    assert repo == "requests"


def test_without_protocol():
    owner, repo = parse_github_url("github.com/fastapi/fastapi")
    assert owner == "fastapi"
    assert repo == "fastapi"


def test_short_owner_repo():
    owner, repo = parse_github_url("facebook/react")
    assert owner == "facebook"
    assert repo == "react"


def test_git_extension():
    owner, repo = parse_github_url("https://github.com/torvalds/linux.git")
    assert owner == "torvalds"
    assert repo == "linux"


def test_short_git_extension():
    owner, repo = parse_github_url("torvalds/linux.git")
    assert owner == "torvalds"
    assert repo == "linux"


def test_www_github():
    owner, repo = parse_github_url("https://www.github.com/vitejs/vite")
    assert owner == "vitejs"
    assert repo == "vite"


def test_trailing_slash():
    owner, repo = parse_github_url("https://github.com/python/cpython/")
    assert owner == "python"
    assert repo == "cpython"


def test_deep_tree_path():
    owner, repo = parse_github_url("https://github.com/pallets/flask/tree/main")
    assert owner == "pallets"
    assert repo == "flask"


def test_url_with_query_and_fragment():
    owner, repo = parse_github_url("https://github.com/django/django?tab=readme#license")
    assert owner == "django"
    assert repo == "django"


def test_invalid_urls():
    with pytest.raises(HTTPException) as exc_info:
        parse_github_url("")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        parse_github_url("just-a-single-name")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        parse_github_url("https://gitlab.com/owner/repo")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        parse_github_url("https://github.com/search")
    assert exc_info.value.status_code == 400
