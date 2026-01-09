# IMPORTANT: Load environment variables BEFORE any imports that use os.getenv()
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not installed, assuming env vars are set by the platform
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.generate import router as generate_router
from app.routes.logging import router as logging_router
import os

# Debug: Check if environment variable is loaded (remove in production)
# print(f"GEMINI_API_KEY loaded: {bool(os.getenv('GEMINI_API_KEY'))}")

app = FastAPI(
    title="Physical Compiler API",
    description="AI-powered 3D model generation from sketches"
)

# CORS for Vercel frontend - Update origin with actual Vercel URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, prefix="/api")
app.include_router(logging_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Physical Compiler API V1", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
