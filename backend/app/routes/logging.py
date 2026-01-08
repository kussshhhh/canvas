from fastapi import APIRouter, Request
from pydantic import BaseModel
import os
import datetime

router = APIRouter()

class ErrorLogRequest(BaseModel):
    source: str
    error: str
    code: str | None = None
    timestamp: str

@router.post("/log/error")
async def log_error(request: ErrorLogRequest):
    try:
        # Go up 3 levels from app/routes/logging.py to get to project root
        # app/routes/logging.py -> app/routes -> app -> backend -> canvas -> root (wait, that's too many)
        # We are in backend/app/routes/logging.py (conceptually)
        # Actually file path will be backend/app/routes/logging.py
        
        # Let's use relative path from where python runs (backend/)
        # So logs are at ../logs
        
        log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../logs"))
        os.makedirs(log_dir, exist_ok=True)
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = os.path.join(log_dir, f"frontend_error_{timestamp}.log")
        
        with open(log_file, "w") as f:
            f.write(f"TIMESTAMP: {request.timestamp}\n")
            f.write(f"SOURCE: {request.source}\n")
            f.write(f"ERROR: {request.error}\n")
            f.write("-" * 50 + "\n")
            if request.code:
                f.write("CODE THAT CAUSED ERROR:\n")
                f.write(request.code)
                f.write("\n" + "-" * 50 + "\n")
                
        return {"status": "logged", "file": log_file}
    except Exception as e:
        print(f"Failed to write error log: {e}")
        return {"status": "failed", "error": str(e)}
