import { useState } from 'react';
import { generateCode } from '../lib/api';

interface GenerateButtonProps {
  imageData: string;
  prompt: string;
  onCodeGenerated: (code: string) => void;
}

export const GenerateButton = ({ imageData, prompt, onCodeGenerated }: GenerateButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!imageData || !prompt.trim()) {
      setError('Please draw a sketch and enter a description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateCode(imageData, prompt);
      onCodeGenerated(response.openSCADCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Generating 3D Model...' : 'Generate 3D Model'}
      </button>
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
