from fastapi import APIRouter, HTTPException
from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.gemini import generate_openscad
import traceback

router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    try:
        # Call service with new optional previousCode
        code = await generate_openscad(
            prompt=request.prompt, 
            image=request.imageBase64,
            previous_code=request.previousCode
        )
        return GenerateResponse(openSCADCode=code)
    except Exception as e:
        print(f"Error in generate endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))