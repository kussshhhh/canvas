import uvicorn
import os
from app.main import app

if __name__ == "__main__":
    # Railway sets the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    # We must listen on 0.0.0.0 for Railway to route traffic
    uvicorn.run(app, host="0.0.0.0", port=port)
