from google import genai
from google.genai import types
import os
import re
import base64

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Debug: Check if environment variable is loaded
if not GEMINI_API_KEY:
    print(f"ERROR: GEMINI_API_KEY not found in environment variables")
    print(f"Available env vars starting with GEMINI: {[k for k in os.environ.keys() if k.startswith('GEMINI')]}")

SYSTEM_PROMPT = """You are an expert JSCAD (OpenJSCAD) programmer. Generate 3D models for a web-based physical compiler.

Guidelines:
- Output ONLY valid JavaScript code containing a main() function
- The main function must return the 3D geometry
- Use @jscad/modeling primitives and operations
- Default units are millimeters
- **CRITICAL**: Do NOT use require(). All JSCAD modelling functions are available via the global `jscad` object.
- **CRITICAL**: You MUST destruct primitives from `jscad` at the start of `main`.

Example format:

const getParameterDefinitions = () => {
  return [
    { name: 'size', type: 'float', initial: 50, caption: 'Size' }
  ];
}

const main = (params) => {
  // Destructure from Global jscad object
  const { cuboid, cylinder } = jscad.primitives;
  const { translate } = jscad.transforms;
  const { union } = jscad.booleans;

  const size = params.size || 50;

  const base = cuboid({size: [size, size, 5]});
  const tower = translate([0, 0, 10], cylinder({height: 20, radius: 5, segments: 32}));
  return union(base, tower);
}

module.exports = { main, getParameterDefinitions };

IMPORTANT: Return ONLY the code, no markdown fencing.
"""

async def generate_openscad(image: str, prompt: str) -> str:
    """
    Generate OpenSCAD code from base64 image and text prompt using Gemini
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Decode base64 image
    try:
        image_bytes = base64.b64decode(image)
    except Exception as e:
        raise ValueError(f"Invalid base64 image data: {e}")

    # Build prompt with image and user description using typed objects
    parts = [
        types.Part.from_text(text=SYSTEM_PROMPT),
        types.Part.from_text(text=f"\n\nUser description: {prompt}"),
        types.Part.from_bytes(data=image_bytes, mime_type="image/png")
    ]

    print(f"--- Sending request to Gemini ---")
    print(f"Prompt: {prompt}")
    print(f"Image size: {len(image_bytes)} bytes")

    try:
        # Call Gemini 2.5 Flash
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=parts)]
        )
        
        # Extract code from response
        code = response.text
        print(f"--- Received response from Gemini ---")
        print(f"Raw response length: {len(code)}")
        print(f"Response snippet: {code[:100]}...")

        # Clean up response (remove markdown code blocks if present)
        code = re.sub(r'```(?:openscad)?\n?', '', code)
        code = re.sub(r'```', '', code)
        code = code.strip()
        
        return code
    
    except Exception as e:
        # Improve error logging
        print(f"Gemini API Error Details: {e}")
        raise Exception(f"Gemini API error: {str(e)}")
