import re
from urllib.parse import urlparse
from fastapi import HTTPException

# GitHub username/org: alphanumeric and hyphens, up to 39 characters
# GitHub repo name: alphanumeric, hyphens, underscores, dots, up to 100 characters
GITHUB_IDENTIFIER_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+$")

# Reserved GitHub root paths that cannot be user/organization names
RESERVED_ROOT_PATHS = {
    "login", "join", "explore", "trending", "topics", "collections",
    "events", "features", "enterprise", "pricing", "security",
    "customer-stories", "marketplace", "search", "settings", "notifications",
    "organizations", "orgs", "new", "import"
}


def parse_github_url(raw_url: str) -> tuple[str, str]:
    """
    Safely extract the (owner, repository) tuple from various GitHub URL formats.

    Supported formats:
        - https://github.com/owner/repo
        - http://github.com/owner/repo
        - https://www.github.com/owner/repo
        - github.com/owner/repo
        - owner/repo
        - https://github.com/owner/repo.git
        - owner/repo.git
        - Deep links: https://github.com/owner/repo/tree/main

    Returns:
        tuple[str, str]: (owner, repository)

    Raises:
        HTTPException: 400 Bad Request if the format is invalid or unsupported.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise HTTPException(
            status_code=400,
            detail="GitHub repository URL cannot be empty."
        )

    clean_url = raw_url.strip()

    # Remove trailing .git if present
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]

    # Prepend https:// if starts with github.com or www.github.com for urlparse
    if clean_url.startswith("github.com/") or clean_url.startswith("www.github.com/"):
        clean_url = f"https://{clean_url}"
    elif "://" not in clean_url and not clean_url.startswith("/"):
        # Could be "owner/repo" or "owner/repo/..."
        segments = [s for s in clean_url.strip("/").split("/") if s]
        if len(segments) >= 2:
            owner, repo = segments[0], segments[1]
            return _validate_and_return(owner, repo, raw_url)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid repository format: '{raw_url}'. Expected 'owner/repo' or a valid GitHub URL."
            )

    try:
        parsed = urlparse(clean_url)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse repository URL: '{raw_url}'. Error: {str(exc)}"
        )

    # Verify domain if host is provided
    if parsed.netloc:
        hostname = parsed.netloc.lower()
        if hostname.endswith(":443") or hostname.endswith(":80"):
            hostname = hostname.split(":")[0]
        if hostname not in ("github.com", "www.github.com"):
            raise HTTPException(
                status_code=400,
                detail=f"Only GitHub repositories are supported. Received host: '{hostname}'."
            )

    # Extract path segments
    path_segments = [seg for seg in parsed.path.strip("/").split("/") if seg]

    if len(path_segments) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete GitHub repository URL: '{raw_url}'. Both owner and repository name are required."
        )

    owner = path_segments[0]
    repo = path_segments[1]

    # Clean any trailing .git from repo segment
    if repo.endswith(".git"):
        repo = repo[:-4]

    return _validate_and_return(owner, repo, raw_url)


def _validate_and_return(owner: str, repo: str, original_url: str) -> tuple[str, str]:
    """Validate extracted owner and repository against standard naming rules."""
    owner = owner.strip()
    repo = repo.strip()

    if not owner or not repo:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repository specification: '{original_url}'. Owner and repository cannot be empty."
        )

    if owner.lower() in RESERVED_ROOT_PATHS:
        raise HTTPException(
            status_code=400,
            detail=f"'{owner}' is a reserved GitHub system keyword and cannot be a repository owner."
        )

    if not GITHUB_IDENTIFIER_PATTERN.match(owner):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid characters in repository owner name: '{owner}'."
        )

    if not GITHUB_IDENTIFIER_PATTERN.match(repo):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid characters in repository name: '{repo}'."
        )

    return owner, repo
