import { useState, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { JSCADViewer } from './components/JSCADViewer';
import { ValidationPanel } from './components/ValidationPanel';
import { BACKEND_URL } from './config';

function App() {
  const [imageData, setImageData] = useState('');
  const [prompt, setPrompt] = useState('');
  const [openSCADCode, setOpenSCADCode] = useState('');
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const isIterating = !!openSCADCode;
  const hasAnyState = !!openSCADCode || !!prompt || !!imageData;

  const handleSnapshot = (image: string) => {
    setSnapshotImage(image);
  };

  const handleReset = useCallback(() => {
    if (confirm("Reset current design session? All code and progress will be cleared.")) {
      setOpenSCADCode('');
      setPrompt('');
      setImageData('');
      setSnapshotImage(null);
      setResetKey(prev => prev + 1); // Force remount Canvas
    }
  }, []);

  const generate = async (shouldIterate: boolean) => {
    if (!prompt.trim()) {
      alert('Please enter an instruction (e.g., "Add a hole" or "Make it bigger")');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: imageData, 
          prompt,
          previousCode: shouldIterate ? (openSCADCode || null) : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'API request failed');
      }

      const data = await response.json();
      setOpenSCADCode(data.openSCADCode);
      setPrompt('');
      setSnapshotImage(null); 
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process request.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => generate(true);

  const handleRegenerateFromScratch = () => {
      if (confirm("This will discard the current 3D model and generate a new one from scratch. Are you sure?")) {
          generate(false);
      }
  };

  return (
    <div className="min-h-screen bg-[var(--tech-bg)] text-[var(--tech-text-main)] font-mono">
      <header className="border-b border-[var(--tech-border)] bg-[var(--tech-surface)] p-4 flex justify-between items-center sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-[var(--tech-accent)] uppercase">
            <span className="mr-2">&gt;_</span>Physical Compiler V1
          </h1>
          <p className="text-[10px] text-[var(--tech-text-muted)] mt-1 tracking-[0.2em]">
            {isIterating ? 'STATUS: REFINEMENT_MODE_ACTIVE' : 'STATUS: INITIAL_VECTOR_STDBY'}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
            {hasAnyState && (
                <button 
                    onClick={handleReset}
                    className="text-[10px] border border-[var(--tech-error)] text-[var(--tech-error)] px-3 py-1 hover:bg-[var(--tech-error)] hover:text-white transition-all uppercase"
                >
                    System_Reset
                </button>
            )}
            <div className={`text-[10px] border px-3 py-1 rounded-sm ${isGenerating ? 'border-[var(--tech-accent)] text-[var(--tech-accent)] animate-pulse' : 'border-[var(--tech-border)] text-[var(--tech-text-muted)]'}`}>
            {isGenerating ? 'EXECUTING_CORE_LOGIC...' : 'CORE_ONLINE'}
            </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Pane: Input */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-[var(--tech-border)] bg-[var(--tech-bg)] custom-scrollbar">
          <div className="space-y-8">
            <section>
              <div className="flex justify-between items-end mb-3 border-b border-[var(--tech-border)] pb-2">
                <h2 className="text-sm font-bold text-[var(--tech-text-muted)] uppercase tracking-widest">
                  01 // {snapshotImage ? 'Context_Snapshot' : 'Geometry_Vector'}
                </h2>
              </div>
              <Canvas key={resetKey} onDrawComplete={setImageData} initialImage={snapshotImage} />
            </section>

            <section>
              <h2 className="text-sm font-bold text-[var(--tech-text-muted)] mb-3 uppercase tracking-widest border-b border-[var(--tech-border)] pb-2">
                02 // {isIterating ? 'Refinement_Directives' : 'Design_Specifications'}
              </h2>
              <div>
                <label className="block mb-2 text-xs text-[var(--tech-accent)] uppercase opacity-70">
                  {isIterating ? '> Enter modification parameters' : '> Define initial object geometry'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isIterating ? "> e.g. 'Add a 10mm radius hole in the center' or 'Make the base 2x thicker'" : "> e.g. 'A smartphone stand with a minimalist charging slot'"}
                  className="w-full p-4 bg-black border border-[var(--tech-border)] rounded-sm focus:border-[var(--tech-accent)] focus:ring-1 focus:ring-[var(--tech-accent)] focus:outline-none text-sm resize-none h-32 text-[var(--tech-text-main)] placeholder-[var(--tech-border)] transition-all"
                />
              </div>
            </section>

            <section className="space-y-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full py-5 border text-sm uppercase tracking-[0.3em] font-bold transition-all relative
                  ${isGenerating 
                    ? 'border-[var(--tech-text-muted)] text-[var(--tech-text-muted)] cursor-not-allowed' 
                    : 'border-[var(--tech-accent)] text-[var(--tech-accent)] hover:bg-[var(--tech-accent)] hover:text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-[0.99]'}`}
              >
                {isGenerating ? 'GEN_SEQUENCE_IN_PROGRESS...' : isIterating ? 'Update_Geometry_Matrix' : 'Initialize_Design_Sequence'}
              </button>

              {isIterating && !isGenerating && (
                <button
                    onClick={handleRegenerateFromScratch}
                    className="w-full py-3 border border-[var(--tech-text-muted)] text-[var(--tech-text-muted)] text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--tech-error)] hover:text-white hover:border-[var(--tech-error)] transition-all opacity-60 hover:opacity-100"
                >
                    Discard & New Attempt
                </button>
              )}
            </section>
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="w-1/2 bg-[#050505] relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-8 bg-[#0a0a0a] border-b border-[var(--tech-border)] flex items-center px-4 justify-between z-10 shadow-md">
            <span className="text-[10px] text-[var(--tech-accent)] uppercase tracking-widest font-bold">
                {isGenerating ? '>> SYNTHESIZING_GEOMETRY' : '>> VIEWPORT_RENDER_ACTIVE'}
            </span>
            <div className="flex gap-2 items-center">
              <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-[var(--tech-accent)] animate-ping' : 'bg-green-500 shadow-[0_0_5px_#22c55e]'}`}></div>
              <span className="text-[9px] text-[var(--tech-text-muted)]">SYNC_LOCKED</span>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden mt-8">
            <JSCADViewer
              openSCADCode={openSCADCode}
              onSnapshot={handleSnapshot}
              isGenerating={isGenerating}
            />
          </div>

          {openSCADCode && (
            <div className="h-40 border-t border-[var(--tech-border)] bg-[var(--tech-surface)] overflow-y-auto p-4 custom-scrollbar shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
               <ValidationPanel openSCADCode={openSCADCode} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;