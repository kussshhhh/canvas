
import { useEffect, useRef, useState } from 'react';
import { prepareRender, cameras, entitiesFromSolids, drawCommands } from '@jscad/regl-renderer';
import * as modeling from '@jscad/modeling';

interface JSCADViewerProps {
  openSCADCode: string; // detailed as 'code' from backend
  base64Image?: string;
}

export const JSCADViewer = ({ openSCADCode, base64Image }: JSCADViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);

  useEffect(() => {
    if (!openSCADCode || !containerRef.current) return;

    const render3D = async () => {
      try {
        setError(null);

        // 1. Prepare the container
        const container = containerRef.current!;
        // Clear previous canvas if any (simple way)
        container.innerHTML = '';

        // 2. Mock 'require' to provide @jscad/modeling
        const require = (moduleName: string) => {
          if (moduleName === '@jscad/modeling') return modeling;
          throw new Error(`Unknown module: ${moduleName}`);
        };

        // 3. Evaluate the code to get the 'main' function
        // We provide a 'jscad' global object mirroring the structure expected by the generated code
        const jscadShim = {
          primitives: modeling.primitives,
          transforms: modeling.transforms,
          booleans: modeling.booleans,
          hulls: modeling.hulls,
          extrusions: modeling.extrusions,
          utils: modeling.utils,
          maths: modeling.maths,
          measurements: modeling.measurements,
        };

        // We wrap it in a function that returns module.exports
        const func = new Function('jscad', 'require', 'module', `
          ${openSCADCode}
          return module.exports;
        `);

        const module = { exports: {} as any };
        const exports = func(jscadShim, require, module);

        if (typeof exports.main !== 'function') {
          throw new Error("Generated code did not export a 'main' function");
        }

        // 4. Resolve Parameters
        let params = {};
        if (typeof exports.getParameterDefinitions === 'function') {
          const definitions = exports.getParameterDefinitions();
          // Extract initial values
          params = definitions.reduce((acc: any, def: any) => {
            acc[def.name] = def.initial;
            return acc;
          }, {});
        }

        // 5. Generate Geometry
        // Verify if main expects arguments (though accessing length property on user code function isn't always reliable, 
        // passing params is standard in JSCAD V2)
        const solids = exports.main(params);
        const entities = entitiesFromSolids({}, solids);

        // 5. Setup Renderer
        const width = container.clientWidth;
        const height = container.clientHeight;


        const perspectiveCamera = cameras.perspective;
        const camera = Object.assign({}, perspectiveCamera.defaults);
        perspectiveCamera.setProjection(camera, camera, { width, height });
        perspectiveCamera.update(camera, camera);

        const options = {
          glOptions: { container },
        };

        const renderer = prepareRender(options);
        rendererRef.current = renderer;

        // 6. Draw Loop
        const render = () => {
          renderer({
            camera,
            drawCommands: {
              drawAxis: drawCommands.drawAxis,
              drawGrid: drawCommands.drawGrid,
              drawLines: drawCommands.drawLines,
              drawMesh: drawCommands.drawMesh,
            },
            entities: entities
          });
        };

        render();

        // Handle resize if needed (simplified for now)
      } catch (err) {
        console.error("Render Failed:", err);
        setError(err instanceof Error ? err.message : 'Render failed');
      }
    };

    render3D();

  }, [openSCADCode]);


  return (
    <div className="jscad-viewer h-full flex flex-col">
      <h3 className="mb-2 text-lg font-semibold">3D Preview</h3>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-2 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {!openSCADCode && !base64Image && (
        <div className="flex-1 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          Draw & Generate to View
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 bg-gray-900 rounded overflow-hidden relative"
        style={{ minHeight: '400px' }}
      >
        {/* Canvas will be injected here */}
      </div>

      {/* Debug Code Toggle (Optional) */}
      {openSCADCode && (
        <details className="mt-2 text-xs text-gray-500">
          <summary>View Generated Code</summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
            {openSCADCode}
          </pre>
        </details>
      )}
    </div>
  );
};
