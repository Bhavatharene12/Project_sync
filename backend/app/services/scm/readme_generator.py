from typing import Any, Dict, List, Optional


def generate_scm_readme(
    repo_data: Dict[str, Any],
    readme_analysis: Optional[Dict[str, Any]] = None,
    topics: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate an enterprise-grade, comprehensive README.md based on repository metadata,
    detected programming language, topics, and SCM best practices.
    """
    name = repo_data.get("name", "Project")
    owner = repo_data.get("owner", {}).get("login", "owner")
    desc = repo_data.get("description") or f"A modern {repo_data.get('language', 'software')} project built for stability and developer productivity."
    language = repo_data.get("language") or "Python"
    default_branch = repo_data.get("default_branch") or "main"
    stars = repo_data.get("stargazers_count", 0)
    forks = repo_data.get("forks_count", 0)
    open_issues = repo_data.get("open_issues_count", 0)

    # Determine language-specific installation & run commands
    lang_lower = language.lower()
    if "python" in lang_lower:
        install_cmd = "pip install -r requirements.txt"
        test_cmd = "pytest -v"
        run_cmd = "python -m app.main"
        env_cmd = "python -m venv venv\nsource venv/bin/activate  # On Windows: .\\venv\\Scripts\\activate"
        folder_structure = f"""{name}/
├── app/
│   ├── main.py              # Application entrypoint
│   ├── routes/              # API and route handlers
│   ├── services/            # Core business & SCM services
│   ├── models/              # Data schemas & models
│   └── utils/               # Shared helpers & configuration
├── tests/                   # Automated test suite
├── .env.example             # Template environment variables
├── requirements.txt         # Production dependencies
└── README.md                # Project documentation"""
    elif "javascript" in lang_lower or "typescript" in lang_lower or "react" in lang_lower or "node" in lang_lower:
        install_cmd = "npm install"
        test_cmd = "npm test"
        run_cmd = "npm run dev"
        env_cmd = "cp .env.example .env"
        folder_structure = f"""{name}/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Application view routes
│   ├── context/             # React state providers
│   ├── api/                 # API HTTP client layer
│   └── main.jsx             # React mounting shell
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── vite.config.js           # Build configuration
└── README.md                # Project documentation"""
    elif "go" in lang_lower:
        install_cmd = "go mod download"
        test_cmd = "go test ./..."
        run_cmd = "go run main.go"
        env_cmd = "cp .env.example .env"
        folder_structure = f"""{name}/
├── cmd/
│   └── main.go              # Main executable entry
├── internal/                # Private application packages
├── pkg/                     # Public library packages
├── go.mod                   # Go module definition
└── README.md                # Documentation"""
    elif "java" in lang_lower or "kotlin" in lang_lower:
        install_cmd = "./mvnw clean install"
        test_cmd = "./mvnw test"
        run_cmd = "./mvnw spring-boot:run"
        env_cmd = "cp application.properties.example application.properties"
        folder_structure = f"""{name}/
├── src/main/java/           # Application source code
├── src/test/java/           # Automated unit & integration tests
├── pom.xml                  # Maven dependencies & build lifecycle
└── README.md                # Documentation"""
    elif "rust" in lang_lower:
        install_cmd = "cargo build"
        test_cmd = "cargo test"
        run_cmd = "cargo run"
        env_cmd = "cp .env.example .env"
        folder_structure = f"""{name}/
├── src/
│   ├── main.rs              # Application binary entry
│   └── lib.rs               # Library root
├── Cargo.toml               # Crate configuration
└── README.md                # Documentation"""
    else:
        install_cmd = "# Run standard package installation command"
        test_cmd = "# Execute test suite"
        run_cmd = "# Execute runtime start command"
        env_cmd = "# Configure environment files"
        folder_structure = f"""{name}/
├── src/                     # Source code directory
├── tests/                   # Test suite directory
├── config/                  # Configuration files
└── README.md                # Documentation"""

    # Format topic tags
    topic_badges = ""
    if topics:
        topic_badges = " ".join([f"`#{t}`" for t in topics])

    markdown = f"""# {name}

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/{owner}/{name})
[![GitHub Stars](https://img.shields.io/github/stars/{owner}/{name}?style=flat-square)](https://github.com/{owner}/{name}/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/{owner}/{name}?style=flat-square)](https://github.com/{owner}/{name}/network/members)
[![Open Issues](https://img.shields.io/github/issues/{owner}/{name}?style=flat-square)](https://github.com/{owner}/{name}/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

{desc}

{topic_badges}

---

## 📑 Table of Contents
- [Features](#-features)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Prerequisites & Requirements](#-prerequisites--requirements)
- [Installation](#-installation)
- [Usage & Quick Start](#-usage--quick-start)
- [Testing](#-testing)
- [SCM Branching & Contributing](#-scm-branching--contributing)
- [Release Management & SemVer](#-release-management--semver)
- [License](#-license)

---

## 🚀 Features
- **High-Efficiency Core**: Modular architecture engineered in **{language}** with low latency and clean separation of concerns.
- **Automated SCM Baseline**: Pre-configured branching, conventional commits, and continuous integration workflows.
- **Resilient Error Handling**: Structured exception hierarchies and defensive validation on all interfaces.
- **Enterprise Ready**: Designed for horizontal scalability, containerization, and automated deployments.

---

## 📂 Architecture & Folder Structure
```text
{folder_structure}
```

---

## ⚙️ Prerequisites & Requirements
- **{language}** runtime environment installed.
- Git (v2.30+ recommended).
- Access to GitHub repository: `https://github.com/{owner}/{name}`.

---

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/{owner}/{name}.git
   cd {name}
   ```

2. **Set up the environment**:
   ```bash
   {env_cmd}
   ```

3. **Install dependencies**:
   ```bash
   {install_cmd}
   ```

---

## 🛠️ Usage & Quick Start

To launch the project locally:
```bash
{run_cmd}
```

Verify service availability:
- Health Endpoint: `http://localhost:8000/` or standard port.
- Primary Branch: `{default_branch}`

---

## 🧪 Testing

Execute automated unit and integration tests:
```bash
{test_cmd}
```

---

## 🤝 SCM Branching & Contributing

We follow standard **Software Configuration Management (SCM)** principles to ensure release stability and traceability.

### 1. Branch Strategy
- **`main`**: Production-ready code only. Direct commits are restricted.
- **`develop`**: Primary integration branch for active development.
- **`feat/<feature-name>`**: Topic branches for new capabilities.
- **`fix/<issue-name>`**: Bug fixes and patches.
- **`release/<version>`**: Release candidates preparing for tag deployment.

### 2. Commit Message Conventions
All commit messages must adhere to the **Conventional Commits** specification:
- `feat(scope): add new capability`
- `fix(scope): resolve identified defect`
- `docs(scope): update documentation`
- `refactor(scope): refactor code without changing behavior`
- `test(scope): add or improve automated tests`

### 3. Pull Request Etiquette
1. Fork the repo and create your branch from `develop` (or `main`).
2. Verify all test suites pass: `{test_cmd}`.
3. Open a Pull Request detailing the changes, motivation, and test evidence.
4. Obtain at least one peer approval before merging.

---

## 🏷️ Release Management & SemVer

This repository adheres to **Semantic Versioning (SemVer)**:
- **MAJOR** (`vX.0.0`): Incompatible API or structural breaking changes.
- **MINOR** (`v0.X.0`): Backwards-compatible new features.
- **PATCH** (`v0.0.X`): Backwards-compatible bug fixes.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---
*Generated automatically by [Sync AI SCM Assistant](https://github.com/{owner}/{name})*
"""

    return {
        "repository": name,
        "owner": owner,
        "language": language,
        "markdown": markdown.strip(),
        "sections_generated": [
            "Project Title & Badges",
            "Description",
            "Table of Contents",
            "Features",
            "Architecture & Folder Structure",
            "Prerequisites & Requirements",
            "Installation",
            "Usage & Quick Start",
            "Testing",
            "SCM Branching & Contributing",
            "Release Management & SemVer",
            "License"
        ],
        "filename": "README.md"
    }
