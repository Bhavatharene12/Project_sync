"""
Backward-compatibility shim for ai_analyzer.
Delegates to modular service: app.services.ai.ai_analyzer
"""
from app.services.ai.ai_analyzer import calculate_health

__all__ = ["calculate_health"]