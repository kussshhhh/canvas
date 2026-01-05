import { useRef, useState, useCallback } from 'react';
import type { Stroke } from '../types';

interface CanvasProps {
  onDrawComplete: (imageData: string) => void;
}

export const Canvas = ({ onDrawComplete }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);

    const newStroke: Stroke = {
      points: [coords],
      color: '#000000',
      width: 3,
    };

    setStrokes([...strokes, newStroke]);
  }, [strokes]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);

    // Update current stroke
    const updatedStrokes = [...strokes];
    const currentStroke = updatedStrokes[updatedStrokes.length - 1];
    currentStroke.points.push(coords);

    setStrokes(updatedStrokes);

    // Draw
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = currentStroke.points;
    if (points.length >= 2) {
      const lastPoint = points[points.length - 2];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  }, [isDrawing, strokes]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);

    // Export canvas as base64 - ensure valid image data
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add a white background (otherwise it's transparent)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the original canvas on top
      tempCtx.drawImage(canvas, 0, 0);
    }

    // Export as base64 (remove data: prefix for cleaner data)
    const fullDataUrl = tempCanvas.toDataURL('image/png');
    const base64Data = fullDataUrl.split(',')[1];

    console.log('Canvas data:', { hasData: !!base64Data, length: base64Data?.length });
    onDrawComplete(base64Data);
  }, [onDrawComplete]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
  }, []);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded cursor-crosshair bg-white"
      />
      <button
        onClick={clearCanvas}
        className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
      >
        Clear Canvas
      </button>
    </div>
  );
};
