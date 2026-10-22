"""
Service for Missing Essentials.
Scans for fundamental repository files (.gitignore, LICENSE, CI workflow, PR template, CONTRIBUTING.md)
and installs them directly with 1-click.
"""
from typing import Dict, Any, List
import base64
import logging
from app.services.github.client import github_client
from app.utils.url_parser import parse_github_url

logger = logging.getLogger("sync.scm.essentials")

TEMPLATES = {
    ".gitignore": """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.env
.venv
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Node / JS
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dist/
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs & OS
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
""",

    "LICENSE": """MIT License

Copyright (c) 2026 Sync Contributor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
""",

    ".github/workflows/ci.yml": """name: Continuous Integration

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
        continue-on-error: true

      - name: Run Build or Test
        run: |
          echo "Running automated SCM verification checks..."
          if [ -f "package.json" ]; then npm ci && npm test --if-present; fi
          if [ -f "requirements.txt" ]; then pip install -r requirements.txt; fi
""",

    ".github/pull_request_template.md": """## 📌 Description
Explain the changes made in this pull request and why they are necessary.

## 🔗 Related Issue
Fixes # (issue number if applicable)

## 🧪 Testing Checklist
- [ ] Code compiles and runs locally without errors
- [ ] Added or updated automated unit tests
- [ ] Verified branch follows Conventional Commits format
- [ ] Documentation updated if necessary

## 📸 Screenshots / Diffs (if applicable)
""",

    "CONTRIBUTING.md": """# Contributing Guidelines

Thank you for your interest in contributing!

## 🌿 Branching Strategy
- `feat/feature-name` for new features
- `fix/bug-name` for bug fixes
- `docs/topic` for documentation updates

## ✍️ Commit Guidelines
Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat: add user authentication`
- `fix: resolve null pointer in parser`
- `docs: update setup instructions`

## 🚀 Pull Request Process
1. Fork the repository and create your branch from `main`.
2. Ensure tests pass before pushing.
3. Open a pull request with a descriptive title and fill out the PR template.
"""
}


def audit_essentials(repo_url: str, token: str = None) -> Dict[str, Any]:
    """
    Checks if core essential files exist in the repository.
    """
    owner, repo = parse_github_url(repo_url)

    files_to_check = [
        {
            "id": "gitignore",
            "path": ".gitignore",
            "name": ".gitignore File",
            "category": "Hygiene",
            "description": "Prevents accidental commits of node_modules, .env secrets, binaries, and build artifacts.",
            "importance": "CRITICAL"
        },
        {
            "id": "license",
            "path": "LICENSE",
            "name": "Open-Source License",
            "category": "Legal",
            "description": "Legally permits others to view, use, fork, and contribute to your repository.",
            "importance": "CRITICAL"
        },
        {
            "id": "ci_workflow",
            "path": ".github/workflows/ci.yml",
            "name": "CI Workflow (GitHub Actions)",
            "category": "Automation",
            "description": "Automatically validates pull requests and prevents broken code from landing in main.",
            "importance": "RECOMMENDED"
        },
        {
            "id": "pr_template",
            "path": ".github/pull_request_template.md",
            "name": "Pull Request Template",
            "category": "Collaboration",
            "description": "Provides teammates with a structured checklist when submitting changes.",
            "importance": "RECOMMENDED"
        },
        {
            "id": "contributing",
            "path": "CONTRIBUTING.md",
            "name": "Contributing Guidelines",
            "category": "Collaboration",
            "description": "Sets clear expectations on branch naming, PR etiquette, and commit conventions.",
            "importance": "OPTIONAL"
        }
    ]

    results = []
    missing_count = 0
    present_count = 0

    for item in files_to_check:
        path = item["path"]
        # Check via GitHub Contents API safely (allow_404 so missing files don't raise an exception)
        file_meta = None
        try:
            file_meta = github_client.get(f"/repos/{owner}/{repo}/contents/{path}", token=token, allow_404=True)
        except Exception as e:
            logger.debug(f"Error checking essential file {path}: {e}")
            file_meta = None

        exists = bool(file_meta and isinstance(file_meta, dict) and "sha" in file_meta)

        if exists:
            present_count += 1
        else:
            missing_count += 1

        results.append({
            **item,
            "exists": exists,
            "current_sha": file_meta.get("sha") if exists else None,
            "template_content": TEMPLATES.get(path, ""),
            "action_available": not exists
        })

    return {
        "repository": f"{owner}/{repo}",
        "summary": {
            "total": len(files_to_check),
            "present": present_count,
            "missing": missing_count,
            "health_status": "Complete" if missing_count == 0 else f"{missing_count} Missing Files"
        },
        "essentials": results
    }


def install_essential_file(
    repo_url: str,
    path: str,
    content: str = None,
    commit_message: str = None,
    branch: str = None,
    token: str = None
) -> Dict[str, Any]:
    """
    Commits an essential file to the repository using GitHub REST API.
    """
    owner, repo = parse_github_url(repo_url)
    
    file_content = content if content is not None else TEMPLATES.get(path, "")
    msg = commit_message or f"chore(scm): add {path} template via Sync Assistant"
    
    encoded_bytes = base64.b64encode(file_content.encode("utf-8")).decode("utf-8")

    # Check if file exists to fetch existing SHA for overwrite (allow 404 for new files)
    existing = None
    try:
        existing = github_client.get(f"/repos/{owner}/{repo}/contents/{path}", token=token, allow_404=True)
    except Exception:
        existing = None
    payload = {
        "message": msg,
        "content": encoded_bytes
    }
    if branch:
        payload["branch"] = branch
    if existing and isinstance(existing, dict) and "sha" in existing:
        payload["sha"] = existing["sha"]

    res = github_client.put(f"/repos/{owner}/{repo}/contents/{path}", data=payload, token=token)
    
    if res and "content" in res:
        return {
            "success": True,
            "path": path,
            "commit_sha": res.get("commit", {}).get("sha", "")[:7],
            "message": f"Successfully created {path} directly in repository"
        }
    
    return {
        "success": False,
        "path": path,
        "error": "Failed to commit file to GitHub. Check repository permissions or token."
    }
