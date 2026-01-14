# canvas

physical compiler v1

transform sketches into 3d printable models.

flow:
- left pane: draw sketch or drop reference images + text prompt
- gemini generates jscad code
- right pane: view 3d preview
- iterate: refine with new instructions
- export stl -> 3d print

stack:
- frontend: react + vite + jscad
- backend: fastapi + gemini api

run:
```bash
# backend
uv run uvicorn app.main:app --reload

# frontend
bun run dev
```
