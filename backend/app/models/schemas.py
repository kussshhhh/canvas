from pydantic import BaseModel, Field

class GenerateRequest(BaseModel):
    imageBase64: str = Field(..., description="Base64 encoded PNG image")
    prompt: str = Field(..., description="User's text description of desired model")

class GenerateResponse(BaseModel):
    openSCADCode: str = Field(..., description="Generated OpenSCAD code")
    rawResponse: str = Field(default=None, description="Optional full AI response")
