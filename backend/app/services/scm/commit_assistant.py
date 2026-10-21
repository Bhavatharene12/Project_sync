import re
from typing import Any, Dict, List

CONVENTIONAL_REGEX = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?!?: .+"
)


def analyze_and_rewrite_commits(
    commits: List[Dict[str, Any]],
    repo_name: str = "project"
) -> Dict[str, Any]:
    """
    Inspect commit messages for hygiene and semantic conventions.
    Automatically rewrites substandard messages into compliant Conventional Commits.
    Generates a downloadable COMMIT_CONVENTION.md guide.
    """
    audited_commits = []
    unstructured_count = 0

    for c in commits:
        original = c.get("commit", {}).get("message", "").strip().split("\n")[0]
        sha = c.get("sha", "")[:7]
        author = c.get("commit", {}).get("author", {}).get("name", "Unknown")

        is_conventional = bool(CONVENTIONAL_REGEX.match(original))
        suggested_rewrite = None

        if not is_conventional:
            unstructured_count += 1
            suggested_rewrite = _rewrite_message(original, repo_name)

        audited_commits.append({
            "sha": sha,
            "original_message": original,
            "author": author,
            "is_conventional": is_conventional,
            "suggested_rewrite": suggested_rewrite
        })

    # Generate Commit Convention Guide for contributors
    guide_markdown = f"""# SCM Commit Convention & Traceability Guide for `{repo_name}`

## 🎯 Purpose
To maintain clean release notes, enable automated versioning (Semantic Release), and provide clear git history traceability, all commits in this repository must follow the **Conventional Commits 1.0.0** specification.

---

## 📐 Format Structure
```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## 🏷️ Allowed Types

| Type | Intent | SemVer Impact | Example |
| :--- | :--- | :--- | :--- |
| `feat` | A new feature or capability | MINOR (0.X.0) | `feat(auth): add OAuth2 GitHub sign-in support` |
| `fix` | A bug fix or patch | PATCH (0.0.X) | `fix(api): handle null pointer when parsing repo tags` |
| `docs` | Documentation changes only | None | `docs(readme): add installation guide for Windows` |
| `refactor` | Code restructuring without feature or bug changes | None | `refactor(db): migrate query building to service layer` |
| `perf` | A code change that improves performance | None | `perf(scanner): cache GitHub branch responses in memory` |
| `test` | Adding missing tests or correcting existing tests | None | `test(scm): add unit tests for SemVer commit parser` |
| `ci` | Changes to CI/CD configuration and scripts | None | `ci(github): add matrix testing for Python 3.11-3.13` |
| `chore` | Other changes that don't modify src or test files | None | `chore(deps): update vite and tailwindcss dependencies` |

---

## 🚫 Common Anti-Patterns vs. Recommended Rewrites

| Substandard Commit Message | Why It's Problematic | Recommended Conventional Commit |
| :--- | :--- | :--- |
| `update` | Vague, no context or scope | `feat(auth): implement token verification middleware` |
| `bug fix` | What bug? Where? | `fix(login): resolve undefined user profile on redirect` |
| `wip` | Never commit WIP to shared branches | `feat(ui): scaffold repository scan cards layout` |
| `fixed stuff` | Unsearchable in git bisect | `fix(api): correct GitHub rate-limit status code mapping` |

---

## 💡 Pro Tips for Maintainers
1. **Use imperative mood in the subject line**: `"add"` not `"added"` or `"adds"`.
2. **Do not capitalize first letter** of the description: `feat(core): initialize database connection`.
3. **No period (.) at the end** of the subject line.
4. **Breaking Changes**: Add `!` after the type/scope or include `BREAKING CHANGE: <explanation>` in the footer to trigger a MAJOR release.
"""

    return {
        "total_commits": len(commits),
        "unstructured_count": unstructured_count,
        "compliance_percentage": round(((len(commits) - unstructured_count) / max(len(commits), 1)) * 100, 1),
        "audited_commits": audited_commits,
        "guide_markdown": guide_markdown.strip()
    }


def _rewrite_message(original: str, repo_name: str) -> str:
    """Smart heuristic to rewrite common vague commit messages into Conventional Commits."""
    msg = original.strip().lower()

    if "fix" in msg or "bug" in msg or "issue" in msg or "error" in msg:
        clean = re.sub(r"^(fix(ed)?|bug|issue|error):?\s*", "", msg).strip()
        scope = "core" if not clean else clean.split()[0]
        return f"fix({scope}): resolve {clean or 'identified defect'}"

    if "doc" in msg or "readme" in msg or "comment" in msg:
        clean = re.sub(r"^(docs?|readme):?\s*", "", msg).strip()
        return f"docs(readme): update {clean or 'documentation and setup instructions'}"

    if "test" in msg or "spec" in msg:
        clean = re.sub(r"^tests?:?\s*", "", msg).strip()
        return f"test(core): add automated tests for {clean or 'regression verification'}"

    if "style" in msg or "format" in msg or "lint" in msg or "css" in msg:
        return f"style(ui): format code and standardize styling"

    if "refactor" in msg or "clean" in msg:
        clean = re.sub(r"^(refactor(ed)?|clean(up)?):?\s*", "", msg).strip()
        return f"refactor(core): simplify {clean or 'module architecture'}"

    if "release" in msg or "bump" in msg:
        return f"chore(release): bump version and prepare release artifacts"

    # Default fallback
    clean = re.sub(r"^(update|add|implement(ed)?|change(d)?|create(d)?):?\s*", "", msg).strip()
    return f"feat(core): implement {clean or 'feature enhancement'}"
