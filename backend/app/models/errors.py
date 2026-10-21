from typing import Optional, Any, Dict
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    hint: Optional[str] = None
    rate_limit_reset: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: Any
