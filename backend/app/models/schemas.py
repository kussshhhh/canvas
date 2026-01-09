from pydantic import BaseModel
from typing import Optional

class GenerateRequest(BaseModel):
    imageBase64: Optional[str] = None
    prompt: str
    previousCode: Optional[str] = None

class GenerateResponse(BaseModel):
    openSCADCode: str
    rawResponse: Optional[str] = None