import { useEffect, useState } from 'react';
import { validatePhysics } from '../lib/validation';
import type { ValidationResult } from '../types';

interface ValidationPanelProps {
  openSCADCode: string;
}

export const ValidationPanel = ({ openSCADCode }: ValidationPanelProps) => {
  const [results, setResults] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (openSCADCode) {
      const validation = validatePhysics(openSCADCode);
      setResults(validation);
    }
  }, [openSCADCode]);

  if (!results) {
    return <div className="p-4 bg-gray-100 rounded">Waiting for model...</div>;
  }

  return (
    <div className="validation-panel">
      <h3 className="mb-3 text-lg font-semibold">Validation Results</h3>

      <div className="space-y-3">
        <div
          className={`p-3 rounded border ${
            results.centerOfGravity.stable
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-2">
              {results.centerOfGravity.stable ? '✅' : '⚠️'}
            </span>
            <div>
              <div className="font-medium">Center of Gravity</div>
              <div className="text-sm text-gray-600">
                {results.centerOfGravity.stable ? 'Stable' : 'Unstable - may tip over'}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded border ${
            results.wallThickness.ok
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-2">
              {results.wallThickness.ok ? '✅' : '⚠️'}
            </span>
            <div>
              <div className="font-medium">Wall Thickness</div>
              <div className="text-sm text-gray-600">
                {results.wallThickness.ok ? 'OK' : `${results.wallThickness.min}mm (minimum 1.5mm)`}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded border ${
            results.overhangAngle.ok
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-2">
              {results.overhangAngle.ok ? '✅' : '⚠️'}
            </span>
            <div>
              <div className="font-medium">Overhang Angle</div>
              <div className="text-sm text-gray-600">
                {results.overhangAngle.ok ? 'OK' : `${results.overhangAngle.max}° (maximum 45° - may need supports)`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
