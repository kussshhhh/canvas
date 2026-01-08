import { useRef, useState, useCallback, useEffect } from 'react';
import type { Stroke } from '../types';

interface CanvasProps {
  onDrawComplete: (imageData: string) => void;
  initialImage?: string | null;
}

export const Canvas = ({ onDrawComplete, initialImage }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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

  const triggerOnDrawComplete = useCallback(() => {
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

  // Handle initialImage changes (Snapshot)
  useEffect(() => {
    if (!initialImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear existing strokes as we are setting a new background
      setStrokes([]);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale image to fit canvas while preserving aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      // Update parent state
      triggerOnDrawComplete();
    };
    // Ensure data URL format
    img.src = initialImage.startsWith('data:') ? initialImage : `data:image/png;base64,${initialImage}`;
  }, [initialImage, triggerOnDrawComplete]);

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
    triggerOnDrawComplete();
  }, [triggerOnDrawComplete]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    triggerOnDrawComplete(); // Clear the output state too
  }, [triggerOnDrawComplete]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Scale image to fit canvas while preserving aspect ratio
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          triggerOnDrawComplete();
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [triggerOnDrawComplete]);

  return (
    <div 
      className={`canvas-container relative rounded-lg ${isDragging ? 'ring-4 ring-blue-400 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-75 z-10 pointer-events-none rounded-lg border-2 border-dashed border-blue-400">
          <p className="text-xl text-blue-600 font-semibold">Drop image here</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
      />
      <div className="flex justify-between mt-2">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-black border border-[var(--tech-accent)] text-[var(--tech-accent)] hover:bg-[var(--tech-accent)] hover:text-black uppercase tracking-wider rounded-sm text-xs font-bold transition-colors"
        >
          Clear Canvas
        </button>
        <span className="text-[10px] text-[var(--tech-text-muted)] uppercase tracking-widest self-center font-mono">
          Draw or drag & drop an image
        </span>
      </div>
    </div>
  );
};