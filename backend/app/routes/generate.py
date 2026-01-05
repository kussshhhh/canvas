from fastapi import APIRouter, HTTPException, Request
from app.services.gemini import generate_openscad
from app.services.rate_limiter import check_rate_limit
from app.models.schemas import GenerateRequest, GenerateResponse

router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, http_request: Request):
    """
    Generate OpenSCAD code from sketch and text description
    """
    # Rate limiting
    if not check_rate_limit(http_request):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 10 requests per minute."
        )
    
    try:
        # Call Gemini
        openscad_code = await generate_openscad(
            image=request.imageBase64,
            prompt=request.prompt
        )
        
        return GenerateResponse(openSCADCode=openscad_code)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate code: {str(e)}"
        )
