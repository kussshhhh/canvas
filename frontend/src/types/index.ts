export interface GenerateRequest {
  imageBase64: string;
  prompt: string;
}

export interface GenerateResponse {
  openSCADCode: string;
  rawResponse?: string;
}

export interface CanvasState {
  isDrawing: boolean;
  strokes: Stroke[];
}

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface ValidationResult {
  centerOfGravity: {
    x: number;
    y: number;
    stable: boolean;
  };
  wallThickness: {
    min: number;
    ok: boolean;
  };
  overhangAngle: {
    max: number;
    ok: boolean;
  };
}
