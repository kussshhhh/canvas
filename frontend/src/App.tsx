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

  const handleGenerate = async () => {
    console.log('Generate button clicked', { hasImage: !!imageData, hasPrompt: !!prompt.trim() });

    if (!imageData || !prompt.trim()) {
      alert('Please draw a sketch and enter a description');
      return;
    }

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
    }
  };

  console.log('App rendering JSX...');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Physical Compiler V1
          </h1>
          <p className="text-sm text-gray-600">
            Sketch → AI Generate → 3D Print
          </p>
        </div>
      </header>

      <main className="flex h-[calc(100vh-72px)]">
        {/* Left Pane */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-300 bg-white">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Sketch Your Design</h2>
              <Canvas onDrawComplete={setImageData} />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Describe Your Design</h2>
              <div>
                <label className="block mb-2 font-medium">
                  Describe your phone stand
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    console.log('Prompt changed:', e.target.value);
                    setPrompt(e.target.value);
                  }}
                  placeholder="E.g., A phone stand with a 30-degree tilt, charging cable cutout, and sleek minimalist design"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Generate 3D Model</h2>
              <button
                onClick={handleGenerate}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Generate 3D Model
              </button>
            </section>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
          <div className="space-y-6">
            <JSCADViewer
              openSCADCode={openSCADCode}
              base64Image={imageData}
            />

            {openSCADCode && (
              <ValidationPanel openSCADCode={openSCADCode} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
