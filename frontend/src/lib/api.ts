import { BACKEND_URL } from '../config';
import type { GenerateRequest, GenerateResponse } from '../types';

export async function generateCode(
  imageBase64: string,
  prompt: string
): Promise<GenerateResponse> {
  const request: GenerateRequest = {
    imageBase64,
    prompt,
  };

  const response = await fetch(`${BACKEND_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}
