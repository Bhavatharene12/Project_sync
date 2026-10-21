"""
Backward-compatibility shim for branch_analyzer.
Delegates to modular service: app.services.scm.branch_analyzer
"""
from app.services.scm.branch_analyzer import analyze_branches

__all__ = ["analyze_branches"]