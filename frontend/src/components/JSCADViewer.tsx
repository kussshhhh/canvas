import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prepareRender, cameras, entitiesFromSolids, drawCommands } from '@jscad/regl-renderer';
import * as modeling from '@jscad/modeling';
import { stlSerializer } from '@jscad/io';
import { BACKEND_URL } from '../config';

interface JSCADViewerProps {
  openSCADCode: string;
  onSnapshot?: (image: string) => void;
  isGenerating?: boolean;
}

export const JSCADViewer = ({ openSCADCode, onSnapshot, isGenerating }: JSCADViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const renderLoopRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const solidsRef = useRef<any[] | null>(null);
  
  const stateRef = useRef<{
    camera: any;
    perspectiveCamera: any;
  } | null>(null);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleSnapshot = () => {
    if (!containerRef.current || !onSnapshot) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onSnapshot(dataUrl);
      } catch (e) {
        console.error("Snapshot failed", e);
      }
    }
  };

  const handleExport = () => {
    if (!solidsRef.current) return;
    try {
      const rawData = stlSerializer.serialize({ binary: true }, ...solidsRef.current);
      const blob = new Blob(rawData, { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `model_${Date.now()}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export STL. See console for details.");
    }
  };

  // --- MANUAL NAVIGATION LOGIC (THE "ATOMIC" FIX) ---
  
  const performZoom = (factor: number) => {
    const s = stateRef.current;
    if (!s) return;
    const cam = s.camera;
    const dx = cam.position[0] - cam.target[0];
    const dy = cam.position[1] - cam.target[1];
    const dz = cam.position[2] - cam.target[2];
    cam.position[0] = cam.target[0] + dx * factor;
    cam.position[1] = cam.target[1] + dy * factor;
    cam.position[2] = cam.target[2] + dz * factor;
    s.perspectiveCamera.update(cam, cam);
  };

  const performRotate = (dx: number, dy: number) => {
    const s = stateRef.current;
    if (!s) return;
    const cam = s.camera;

    // 1. Calculate relative vector
    const rx = cam.position[0] - cam.target[0];
    const ry = cam.position[1] - cam.target[1];
    const rz = cam.position[2] - cam.target[2];

    // 2. Spherical conversion
    let radius = Math.sqrt(rx*rx + ry*ry + rz*rz);
    let theta = Math.atan2(ry, rx); // azimuth
    let phi = Math.acos(rz / radius); // inclination

    // 3. Apply deltas
    theta += dx * 0.01;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + dy * 0.01));

    // 4. Back to Cartesian
    cam.position[0] = cam.target[0] + radius * Math.sin(phi) * Math.cos(theta);
    cam.position[1] = cam.target[1] + radius * Math.sin(phi) * Math.sin(theta);
    cam.position[2] = cam.target[2] + radius * Math.cos(phi);

    s.perspectiveCamera.update(cam, cam);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    performZoom(0.8); 
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    performZoom(1.2);
  };

  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.innerHTML = ''; 
    solidsRef.current = null;

    if (!openSCADCode) return;

    let isActive = true;

    try {
      setError(null);

      // 1. Setup JSCAD Env
      const jscadShim = {
        primitives: modeling.primitives,
        transforms: modeling.transforms,
        booleans: modeling.booleans,
        hulls: modeling.hulls,
        extrusions: modeling.extrusions,
        utils: modeling.utils,
        maths: modeling.maths,
        measurements: modeling.measurements,
        geometries: modeling.geometries,
        expansions: modeling.expansions,
        colors: modeling.colors,
      };

      const func = new Function('jscad', 'require', 'module', `
        ${openSCADCode}
        return module.exports;
      `);

      const module = { exports: {} as any };
      const exports = func(jscadShim, (m: string) => m === '@jscad/modeling' ? modeling : null, module);

      let params = {};
      if (typeof exports.getParameterDefinitions === 'function') {
        params = exports.getParameterDefinitions().reduce((acc: any, def: any) => {
          acc[def.name] = def.initial;
          return acc;
        }, {});
      }

      const solids = exports.main(params);
      solidsRef.current = Array.isArray(solids) ? solids : [solids];
      const entities = entitiesFromSolids({}, solids);

      // 2. Renderer & Camera
      const perspectiveCamera = cameras.perspective;
      const camera = Object.assign({}, perspectiveCamera.defaults);
      perspectiveCamera.setProjection(camera, camera, { 
        width: container.clientWidth, 
        height: container.clientHeight 
      });
      // Initial position for better view
      camera.position = [500, 500, 500];
      perspectiveCamera.update(camera, camera);

      stateRef.current = { camera, perspectiveCamera };

      const renderer = prepareRender({
        glOptions: { container, attributes: { preserveDrawingBuffer: true } }
      });

      // 3. High-Performance Interaction
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      const onDown = (e: MouseEvent) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };

      const onUp = () => { 
        isDragging = false; 
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      const onMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        performRotate(-dx, -dy);
        lastX = e.clientX;
        lastY = e.clientY;
      };
      
      const onWheel = (e: WheelEvent) => {
         e.preventDefault();
         const factor = e.deltaY > 0 ? 1.1 : 0.9;
         performZoom(factor);
      };

      container.addEventListener('mousedown', onDown);
      container.addEventListener('wheel', onWheel, { passive: false });
      container.addEventListener('contextmenu', (e) => e.preventDefault());

      // 4. Resize
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width === 0 || height === 0) continue;
          perspectiveCamera.setProjection(camera, camera, { width, height });
          perspectiveCamera.update(camera, camera);
          const canvas = container.querySelector('canvas');
          if (canvas) {
              const pr = window.devicePixelRatio || 1;
              canvas.width = width * pr;
              canvas.height = height * pr;
          }
        }
      });
      resizeObserver.observe(container);

      // 5. Loop
      const loop = () => {
        if (!isActive) return;
        renderer({
          camera,
          drawCommands: {
            drawAxis: drawCommands.drawAxis,
            drawGrid: drawCommands.drawGrid,
            drawLines: drawCommands.drawLines,
            drawMesh: drawCommands.drawMesh,
          },
          entities: [
            { visuals: { drawCmd: 'drawGrid', show: true, color: [0, 0.8, 0.8, 0.3], subColor: [0, 0.4, 0.4, 0.1], size: 1000, ticks: 100 } },
            { visuals: { drawCmd: 'drawAxis', show: true } },
            ...entities
          ]
        });
        renderLoopRef.current = requestAnimationFrame(loop);
      };
      loop();

      cleanupRef.current = () => {
        isActive = false;
        resizeObserver.disconnect();
        if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
        container.removeEventListener('mousedown', onDown);
        container.removeEventListener('wheel', onWheel);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed');
      // Log error to backend
      fetch(`${BACKEND_URL}/api/log/error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'frontend_render',
            error: err instanceof Error ? err.message : 'Render failed',
            code: openSCADCode,
            timestamp: new Date().toISOString()
          })
      }).catch(e => console.warn("Failed to send error log:", e));
    }

    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [openSCADCode, isFullscreen]);

  const viewerContent = (
    <div className={`w-full h-full relative bg-black flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : ''}`}>
       {/* Tech Controls Overlay */}
       <div className="absolute top-4 right-4 z-[110] flex gap-2">
        {openSCADCode && (
          <button
            onClick={handleExport}
            className="bg-black border border-[var(--tech-accent)] text-[var(--tech-accent)] px-3 py-1 text-xs hover:bg-[var(--tech-accent)] hover:text-black uppercase tracking-wider transition-all font-mono flex items-center shadow-[0_0_10px_rgba(0,243,255,0.2)]"
          >
            EXPORT STL
          </button>
        )}

        {onSnapshot && openSCADCode && (
          <button
            onClick={handleSnapshot}
            className="bg-black border border-[var(--tech-accent)] text-[var(--tech-accent)] px-3 py-1 text-xs hover:bg-[var(--tech-accent)] hover:text-black uppercase tracking-wider transition-all font-mono flex items-center shadow-[0_0_10px_rgba(0,243,255,0.2)]"
          >
            <span className="mr-2">REC</span> SNAPSHOT
          </button>
        )}
        
        <div className="flex border border-[var(--tech-border)] rounded-sm bg-black shadow-[0_0_10px_rgba(0,243,255,0.1)]">
            <button type="button" onClick={handleZoomIn} className="px-3 py-1 text-[var(--tech-accent)] hover:bg-[var(--tech-border)] font-mono border-r border-[var(--tech-border)] active:bg-[var(--tech-accent)] active:text-black">+</button>
            <button type="button" onClick={handleZoomOut} className="px-3 py-1 text-[var(--tech-accent)] hover:bg-[var(--tech-border)] font-mono active:bg-[var(--tech-accent)] active:text-black">-</button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="bg-black border border-[var(--tech-border)] text-[var(--tech-text-muted)] px-3 py-1 text-xs hover:border-[var(--tech-accent)] hover:text-[var(--tech-accent)] uppercase tracking-wider font-mono transition-all shadow-[0_0_10px_rgba(0,243,255,0.1)]"
        >
          {isFullscreen ? "[ X ]" : "[ MAX ]"}
        </button>
      </div>

      {/* Navigation Hint (Only when model exists) */}
      {openSCADCode && (
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="text-[9px] text-[var(--tech-text-muted)] font-mono uppercase tracking-widest bg-black/40 p-2 border-l border-[var(--tech-accent)]">
            DRAG_TO_ORBIT // SCROLL_TO_ZOOM
          </div>
        </div>
      )}

      {/* States */}
      {!openSCADCode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            {isGenerating ? (
              <div className="text-[var(--tech-accent)] font-mono animate-pulse">
                <div className="text-xs mb-2 uppercase tracking-widest">Compiling Design Data</div>
                <div className="border border-[var(--tech-accent)] px-8 py-4 text-xl bg-black shadow-[0_0_20px_rgba(0,243,255,0.3)]">INITIALIZING_GEOMETRY...</div>
              </div>
            ) : (
              <div className="text-[var(--tech-text-muted)] font-mono">
                <div className="text-xs mb-2 uppercase tracking-widest">Awaiting Vector Stream</div>
                <div className="border border-[var(--tech-border)] px-8 py-4 text-xl text-[var(--tech-accent)]">CORE_SYSTEM_READY</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-[120] p-4">
           <div className="border border-[var(--tech-error)] p-6 max-w-md bg-black text-[var(--tech-error)] font-mono text-xs shadow-[0_0_20px_rgba(255,51,51,0.2)]">
             <div className="border-b border-[var(--tech-error)] mb-3 font-bold pb-2 uppercase tracking-tighter">HALT: GEOMETRY_OVERFLOW_ERROR</div>
             {error}
           </div>
        </div>
      )}

      {/* 3D Container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden w-full h-full relative" 
        style={{ cursor: 'crosshair', pointerEvents: 'auto' }} 
      />

       {/* Source Code */}
       {openSCADCode && !isFullscreen && (
        <details className="border-t border-[var(--tech-border)] bg-black">
          <summary className="cursor-pointer p-2 text-[10px] text-[var(--tech-text-muted)] hover:text-[var(--tech-accent)] font-mono uppercase tracking-widest transition-colors">
            &gt; Raw_Vector_Source
          </summary>
          <pre className="p-4 text-[10px] text-[var(--tech-text-main)] overflow-auto max-h-40 font-mono bg-[#050505] custom-scrollbar selection:bg-[var(--tech-accent)] selection:text-black">{openSCADCode}</pre>
        </details>
      )}
    </div>
  );

  return isFullscreen ? createPortal(viewerContent, document.body) : (
    <div className="jscad-viewer h-full flex flex-col border border-[var(--tech-border)] bg-black overflow-hidden">{viewerContent}</div>
  );
};