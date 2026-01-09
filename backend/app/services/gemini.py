from google import genai
from google.genai import types
import os
import re
import base64
import datetime

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """You are an expert JSCAD (OpenJSCAD) programmer. Generate 3D models for a web-based physical compiler.

Guidelines:
- Output ONLY valid JavaScript code containing a main() function.
- The main function must return the 3D geometry.
- Use @jscad/modeling primitives and operations.
- **CRITICAL**: Do NOT use require(). All JSCAD modelling functions are available via the global `jscad` object.
- **CRITICAL**: Boolean operations (union, subtract, intersect) return a SINGLE geometry object, NOT an array. NEVER call .map() on the result of a boolean operation.

ITERATION MODE:
If "PREVIOUS JSCAD CODE" is provided, you are in EDITING MODE.
1. Analyze the existing code and the new user instruction/sketch.
2. Modify the code to apply the requested changes (e.g., "add a hole", "make it taller", "attach this new part").
3. Try to maintain the existing variable names and structure for consistency.
4. If a new sketch is provided alongside previous code, treat the sketch as a visual guide for the modifications.

Example format:
const main = (params) => {
  const { cuboid } = jscad.primitives;
  return cuboid({size: [10, 10, 10]});
}
module.exports = { main };
"""

async def generate_openscad(prompt: str, image: str = None, previous_code: str = None) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # 1. Build context-aware prompt
    context_text = f"USER INSTRUCTION: {prompt}"
    if previous_code:
        context_text = f"--- EDITING EXISTING CODE ---\nPREVIOUS JSCAD CODE:\n{previous_code}\n\nNEW INSTRUCTION: {prompt}"
    
    parts = [
        types.Part.from_text(text=SYSTEM_PROMPT),
        types.Part.from_text(text=context_text)
    ]

    # 2. Add image if provided (snapshot or new sketch)
    if image:
        try:
            # Strip data URL prefix if present
            img_data = image.split(",")[1] if "," in image else image
            image_bytes = base64.b64decode(img_data)
            parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/png"))
        except Exception as e:
            print(f"Warning: Image attachment failed: {e}")

    print(f"--- Sending request to Gemini (Multiturn) ---")
    print(f"Model Mode: {'ITERATION' if previous_code else 'NEW_DESIGN'}")

    # Using the model chain defined in project specs
    models_to_try = [
        "gemini-3-pro-preview", 
        "gemini-3-flash",
        "gemini-3-flash-preview", 
        "gemini-2.5-flash"
    ]
    last_exception = None

    for model in models_to_try:
        try:
            print(f"Attempting generation with: {model}")
            response = client.models.generate_content(
                model=model,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(temperature=0.0)
            )
            
            code = response.text
            # Cleanup markdown
            code = re.sub(r'```(?:openscad|javascript|js)?\n?', '', code)
            code = re.sub(r'```', '', code)
            return code.strip()
        except Exception as e:
            print(f"Model {model} failed: {e}")
            last_exception = e
            # If 429 or model not found, try the next one in the chain
            continue

    raise Exception(f"Generation failed: All models exhausted. Last error: {str(last_exception)}")