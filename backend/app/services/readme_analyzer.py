"""
Backward-compatibility shim for readme_analyzer.
Delegates to modular service: app.services.ai.readme_analyzer
"""
from app.services.ai.readme_analyzer import analyze_readme

__all__ = ["analyze_readme"]