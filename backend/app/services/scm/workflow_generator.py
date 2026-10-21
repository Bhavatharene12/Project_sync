from typing import Any, Dict


def generate_ci_workflow(
    repo_data: Dict[str, Any],
    default_branch: str = "main"
) -> Dict[str, Any]:
    """
    Generate an optimized GitHub Actions Continuous Integration (CI) workflow YAML
    customized to the repository's primary programming language.
    """
    repo_name = repo_data.get("name", "Project")
    language = (repo_data.get("language") or "Python").strip()
    lang_lower = language.lower()

    if "python" in lang_lower:
        filename = "ci-python.yml"
        yaml_content = f"""name: CI Pipeline ({language})

on:
  push:
    branches: [ {default_branch}, develop ]
  pull_request:
    branches: [ {default_branch}, develop ]

permissions:
  contents: read

jobs:
  test:
    name: Build & Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12", "3.13"]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python ${{{{ matrix.python-version }}}}
        uses: actions/setup-python@v5
        with:
          python-version: ${{{{ matrix.python-version }}}}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest flake8

      - name: Lint with flake8
        run: |
          # Stop build if there are Python syntax errors or undefined names
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          # Exit-zero treats all errors as warnings
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

      - name: Run automated tests with pytest
        run: |
          pytest -v
"""
    elif "javascript" in lang_lower or "typescript" in lang_lower or "react" in lang_lower or "node" in lang_lower:
        filename = "ci-node.yml"
        yaml_content = f"""name: CI Pipeline (Node.js)

on:
  push:
    branches: [ {default_branch}, develop ]
  pull_request:
    branches: [ {default_branch}, develop ]

permissions:
  contents: read

jobs:
  build-and-test:
    name: Test & Build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Use Node.js ${{{{ matrix.node-version }}}}
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ matrix.node-version }}}}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run code linter
        run: npm run lint --if-present

      - name: Run unit tests
        run: npm test --if-present

      - name: Build production bundle
        run: npm run build --if-present
"""
    elif "java" in lang_lower or "kotlin" in lang_lower:
        filename = "ci-java.yml"
        yaml_content = f"""name: CI Pipeline (Java)

on:
  push:
    branches: [ {default_branch}, develop ]
  pull_request:
    branches: [ {default_branch}, develop ]

jobs:
  build:
    name: Build & Verify
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Build with Maven
        run: mvn -B package --file pom.xml

      - name: Run unit and integration tests
        run: mvn test
"""
    elif "go" in lang_lower:
        filename = "ci-go.yml"
        yaml_content = f"""name: CI Pipeline (Go)

on:
  push:
    branches: [ {default_branch}, develop ]
  pull_request:
    branches: [ {default_branch}, develop ]

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Install dependencies
        run: go mod download

      - name: Run tests with coverage
        run: go test -v -race -covermode=atomic ./...

      - name: Verify build binary
        run: go build -v ./...
"""
    else:
        filename = "ci.yml"
        yaml_content = f"""name: General CI Pipeline

on:
  push:
    branches: [ {default_branch}, develop ]
  pull_request:
    branches: [ {default_branch}, develop ]

jobs:
  audit:
    name: Automated Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run test command
        run: echo "Running automated SCM checks for {repo_name}..."
"""

    return {
        "filename": filename,
        "target_path": f".github/workflows/{filename}",
        "language": language,
        "yaml_content": yaml_content.strip(),
        "triggers": ["push", "pull_request"],
        "branches_monitored": [default_branch, "develop"]
    }
