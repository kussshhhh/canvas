console.log('App component rendering');


import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { JSCADViewer } from './components/JSCADViewer';
import { ValidationPanel } from './components/ValidationPanel';

function App() {
  console.log('App function called');

  const [imageData, setImageData] = useState('');
  const [prompt, setPrompt] = useState('');
  const [openSCADCode, setOpenSCADCode] = useState('');
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSnapshot = (image: string) => {
    setSnapshotImage(image);
  };

  const handleGenerate = async () => {
    console.log('Generate button clicked', { hasImage: !!imageData, hasPrompt: !!prompt.trim() });

    if (!imageData || !prompt.trim()) {
      alert('Please draw a sketch and enter a description');
      return;
    }

    setIsGenerating(true);
    setOpenSCADCode(''); // Clear previous code to trigger "loading" visual in viewer if needed

    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageData, prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'API request failed');
      }

      const data = await response.json();
      console.log('API response:', data);
      setOpenSCADCode(data.openSCADCode);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  console.log('App rendering JSX...');

  return (
    <div className="min-h-screen bg-[var(--tech-bg)] text-[var(--tech-text-main)] font-mono selection:bg-[var(--tech-accent)] selection:text-black">
      <header className="border-b border-[var(--tech-border)] bg-[var(--tech-surface)] p-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-[var(--tech-accent)] uppercase">
            <span className="mr-2">&gt;_</span>Physical Compiler V1
          </h1>
          <p className="text-xs text-[var(--tech-text-muted)] mt-1">
            SKETCH_TO_GCODE // SYSTEM_READY
          </p>
        </div>
        <div className="text-xs text-[var(--tech-text-muted)] border border-[var(--tech-border)] px-2 py-1 rounded">
          STATUS: {isGenerating ? 'PROCESSING_DATA...' : 'ONLINE'}
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Pane */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-[var(--tech-border)] bg-[var(--tech-bg)] custom-scrollbar">
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold text-[var(--tech-text-muted)] mb-3 uppercase tracking-widest border-b border-[var(--tech-border)] pb-2">
                01 // Input_Vector
              </h2>
              <Canvas onDrawComplete={setImageData} initialImage={snapshotImage} />
            </section>

            <section>
              <h2 className="text-sm font-bold text-[var(--tech-text-muted)] mb-3 uppercase tracking-widest border-b border-[var(--tech-border)] pb-2">
                02 // Parameters
              </h2>
              <div>
                <label className="block mb-2 text-xs text-[var(--tech-accent)] uppercase">
                  Description Protocol
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    console.log('Prompt changed:', e.target.value);
                    setPrompt(e.target.value);
                  }}
                  placeholder="> Enter design specifications..."
                  className="w-full p-3 bg-black border border-[var(--tech-border)] rounded-sm focus:border-[var(--tech-accent)] focus:outline-none text-sm resize-none h-32 text-[var(--tech-text-main)] placeholder-[var(--tech-border)]"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[var(--tech-text-muted)] mb-3 uppercase tracking-widest border-b border-[var(--tech-border)] pb-2">
                03 // Execution
              </h2>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full py-4 border text-sm uppercase tracking-widest font-bold relative overflow-hidden group transition-all duration-100 
                  ${isGenerating 
                    ? 'border-[var(--tech-text-muted)] text-[var(--tech-text-muted)] cursor-not-allowed bg-[var(--tech-surface)]' 
                    : 'border-[var(--tech-accent)] text-[var(--tech-accent)] hover:bg-[var(--tech-accent)] hover:text-black active:scale-[0.98]'}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <span className="animate-pulse">:: PROCESSING ::</span>
                    </>
                  ) : (
                    'Initialize Generation Sequence'
                  )}
                </span>
              </button>
            </section>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-1/2 bg-[#050505] relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-6 bg-[var(--tech-surface)] border-b border-[var(--tech-border)] flex items-center px-4 justify-between z-10">
            <span className="text-[10px] text-[var(--tech-text-muted)] uppercase tracking-widest">Viewport_3D // JSCAD_Renderer</span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full border border-[var(--tech-border)] ${isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-transparent'}`}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--tech-border)]"></div>
              <div className={`w-2 h-2 rounded-full ${openSCADCode ? 'bg-[var(--tech-accent)] animate-pulse' : 'bg-[var(--tech-border)]'}`}></div>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden mt-6">
            <JSCADViewer
              openSCADCode={openSCADCode}
              onSnapshot={handleSnapshot}
              isGenerating={isGenerating}
            />
          </div>

          {openSCADCode && (
            <div className="h-48 border-t border-[var(--tech-border)] bg-[var(--tech-surface)] overflow-y-auto p-4 custom-scrollbar">
               <ValidationPanel openSCADCode={openSCADCode} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
