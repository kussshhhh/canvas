# Physical Compiler V1

Transform intent into manufacturable objects. Sketch → AI generates → 3D print.

## Quick Start

### Backend (FastAPI)
```bash
cd backend
# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh
# Setup and install
# Setup and install
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload
```

### Frontend (React + Vite)
```bash
cd frontend
bun install
bun run dev
```

## Architecture

- **Frontend**: React + Vite + JSCAD (deployed on Vercel)
- **Backend**: FastAPI + Gemini 2.5 Flash (deployed on Railway)
- **Flow**: Sketch canvas → Send image to backend → Gemini generates OpenSCAD → Render 3D

See [PLAN.md](./PLAN.md) for complete implementation details.

## Development Status

- [x] Phase 1: Repository Setup
- [ ] Phase 2: Backend Development
- [ ] Phase 3: Frontend Core
- [ ] Phase 4: 3D Rendering
- [ ] Phase 5: Validation
- [ ] Phase 6: UI Polish
- [ ] Phase 7: Testing
- [ ] Phase 8: Deployment

## Environment Setup

### Backend (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (.env)
```bash
VITE_BACKEND_URL=http://localhost:8000
```

## License

MIT
