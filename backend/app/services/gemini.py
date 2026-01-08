from google import genai
from google.genai import types
import os
import re
import base64
import datetime

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
- **CRITICAL**: Boolean operations (union, subtract, intersect) return a SINGLE geometry object, NOT an array. NEVER call .map() on the result of a boolean operation. To transform the result, wrap it in a transform function, e.g., `translate([x, y, z], result)`.

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
  const { union, subtract } = jscad.booleans;

  const size = params.size || 50;

  const base = cuboid({size: [size, size, 5]});
  const hole = cylinder({height: 20, radius: 5, segments: 32});
  
  // Correct: Apply transform to the single result
  const part = subtract(base, hole);
  return translate([0, 0, 10], part); 
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

    # Correct model names based on availability
    models_to_try = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-flash"]
    last_exception = None

    for model in models_to_try:
        try:
            print(f"--- Attempting generation with model: {model} ---")
            # Call Gemini with deterministic config
            response = client.models.generate_content(
                model=model,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(
                    temperature=0.0
                )
            )
            
            # Extract code from response
            code = response.text
            print(f"--- Received response from {model} ---")
            
            # LOGGING: Save raw response to file
            try:
                # Get project root logs directory
                current_file_dir = os.path.dirname(os.path.abspath(__file__))
                log_dir = os.path.abspath(os.path.join(current_file_dir, "../../../logs"))
                os.makedirs(log_dir, exist_ok=True)
                
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                log_file = os.path.join(log_dir, f"backend_{timestamp}_{model}.log")
                
                with open(log_file, "w") as f:
                    f.write(f"TIMESTAMP: {timestamp}\n")
                    f.write(f"MODEL: {model}\n")
                    f.write(f"PROMPT: {prompt}\n")
                    f.write("-" * 50 + "\n")
                    f.write("FULL RAW RESPONSE:\n")
                    f.write(code)
                    f.write("\n" + "-" * 50 + "\n")
                
                print(f"--- Logged response to {log_file} ---")
            except Exception as log_err:
                print(f"--- Warning: Failed to write log file: {log_err} ---")

            print(f"Raw response length: {len(code)}")
            print(f"Response snippet: {code[:100]}...")

            # Clean up response (remove markdown code blocks if present)
            code = re.sub(r'```(?:openscad|javascript|js)?\n?', '', code)
            code = re.sub(r'```', '', code)
            code = code.strip()
            
            return code
        
        except Exception as e:
            print(f"--- Warning: Failed with {model} ---")
            print(f"Error Details: {e}")
            last_exception = e
            # Continue to next model in the list
            continue

    # If we get here, all models failed
    raise Exception(f"Gemini API error: All models failed. Last error: {str(last_exception)}")