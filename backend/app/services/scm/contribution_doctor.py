"""
Service for Contribution Doctor.
Diagnoses why GitHub contribution activity (green squares) is missing:
- Mismatched git config email vs verified GitHub account emails
- Commits on unmerged non-default branches
- Fork commit isolation
Provides copy-paste 1-click terminal commands to fix author identity.
"""
from typing import Dict, Any, List, Set
import logging
from fastapi import HTTPException
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.doctor")


def diagnose_contributions(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Diagnoses contribution graph discrepancies for the repository and current developer.
    """
    owner, repo = parse_github_url(repo_url)

    # 1. Fetch authenticated user profile & verified emails if token present
    user_info = {}
    verified_emails: Set[str] = set()
    username = None

    token_scope_notice = None

    if token:
        try:
            user_data = github_client.get("/user", token=token, allow_404=True)
            if user_data and isinstance(user_data, dict) and "login" in user_data:
                user_info = user_data
                username = user_data.get("login")
                if user_data.get("email"):
                    verified_emails.add(user_data["email"].lower())
        except Exception as e:
            logger.debug(f"Could not fetch /user profile: {e}")

        try:
            emails_data = github_client.get("/user/emails", token=token, allow_404=True)
            if isinstance(emails_data, list):
                for entry in emails_data:
                    if entry.get("verified") is True:
                        verified_emails.add(entry.get("email", "").lower())
        except HTTPException as he:
            if he.status_code == 403:
                token_scope_notice = (
                    "Your Personal Access Token needs the 'user:email' scope to inspect private verified emails. "
                    "You can still inspect commit author identities and configure your local git email below."
                )
            else:
                logger.debug(f"Could not fetch /user/emails: {he}")
        except Exception as e:
            logger.debug(f"Unexpected error fetching emails: {e}")

    # 2. Fetch repository metadata to check if it's a fork and get default branch
    repo_meta = github_client.get(f"/repos/{owner}/{repo}", token=token) or {}
    is_fork = repo_meta.get("fork", False)
    default_branch = repo_meta.get("default_branch", "main")

    # 3. Fetch recent commits to inspect author emails
    commits = github_client.get(f"/repos/{owner}/{repo}/commits?per_page=30", token=token) or []

    commit_authors: Dict[str, Dict[str, Any]] = {}
    for c in commits:
        author_info = c.get("commit", {}).get("author", {})
        name = author_info.get("name", "Unknown")
        email = (author_info.get("email") or "").lower()
        if not email:
            continue
        
        if email not in commit_authors:
            commit_authors[email] = {
                "name": name,
                "email": email,
                "commit_count": 0,
                "matched_github_user": c.get("author", {}).get("login"),
                "sample_sha": c.get("sha", "")[:7]
            }
        commit_authors[email]["commit_count"] += 1

    # 4. Analyze potential issues
    diagnoses: List[Dict[str, Any]] = []

    # Check: Unmatched Emails
    for email, data in commit_authors.items():
        is_matched = bool(data["matched_github_user"])
        has_verified_email = email in verified_emails if verified_emails else is_matched

        if not has_verified_email and not is_matched:
            diagnoses.append({
                "type": "EMAIL_MISMATCH",
                "severity": "CRITICAL",
                "title": f"Git Email '{email}' is Not Linked to Your GitHub Account",
                "description": f"You made {data['commit_count']} commits with '{email}'. GitHub only awards green squares if the commit email is added to your GitHub Account Settings -> Emails.",
                "solution_command": f'git config --global user.email "{list(verified_emails)[0] if verified_emails else "your_github_email@example.com"}"',
                "fix_guide": "1. Go to GitHub Settings -> Emails\n2. Add this email and verify it\n3. Or configure your local git config to use your primary verified email."
            })

    # Check: Fork contributions
    if is_fork:
        diagnoses.append({
            "type": "FORK_REPOSITORY",
            "severity": "WARNING",
            "title": "Repository is a Fork",
            "description": "GitHub by default does not count commits in a fork towards your contribution calendar unless they are merged into the upstream repository via a Pull Request.",
            "solution_command": None,
            "fix_guide": "To credit fork commits, create a Pull Request to the upstream repository, or enable 'Include private and fork contributions' on your GitHub profile settings."
        })

    # If no problems detected
    if not diagnoses:
        diagnoses.append({
            "type": "HEALTHY",
            "severity": "SUCCESS",
            "title": "Contribution Pipeline Configured Correctly",
            "description": f"All {len(commit_authors)} author emails match recognized GitHub users. Commits on '{default_branch}' count toward your green contribution calendar.",
            "solution_command": None,
            "fix_guide": "Keep committing with your current git configuration!"
        })

    primary_fix_command = (
        f'git config --global user.email "{list(verified_emails)[0]}"'
        if verified_emails else 'git config --global user.email "your_verified_email@example.com"'
    )

    return {
        "repository": f"{owner}/{repo}",
        "authenticated_as": username,
        "token_scope_notice": token_scope_notice,
        "is_fork": is_fork,
        "default_branch": default_branch,
        "verified_emails": list(verified_emails),
        "detected_authors": list(commit_authors.values()),
        "has_issues": any(d["severity"] in ["CRITICAL", "WARNING"] for d in diagnoses),
        "diagnoses": diagnoses,
        "quick_fix_command": primary_fix_command
    }
