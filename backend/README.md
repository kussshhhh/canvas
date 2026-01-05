# Backend README

## Setup (using uv)

```bash
# Install uv if not installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

## Run

```bash
uv run uvicorn app.main:app --reload
```

## Environment

Copy `.env.example` to `.env` and add your Gemini API key.

## API Endpoints

- `POST /api/generate` - Generate OpenSCAD code from image + prompt
- `GET /health` - Health check
