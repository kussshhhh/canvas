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
    return (
      <div className="p-4 border border-[var(--tech-border)] bg-black text-[var(--tech-text-muted)] font-mono text-xs animate-pulse">
        &gt; ANALYZING_GEOMETRY...
      </div>
    );
  }

  return (
    <div className="validation-panel font-mono">
      <h3 className="mb-4 text-xs font-bold text-[var(--tech-text-muted)] uppercase tracking-widest border-b border-[var(--tech-border)] pb-2">
        // Physics_Simulation_Report
      </h3>

      <div className="space-y-2">
        {/* Center of Gravity */}
        <div
          className={`p-3 border ${
            results.centerOfGravity.stable
              ? 'border-[var(--tech-accent)] bg-[rgba(0,243,255,0.05)]'
              : 'border-[var(--tech-error)] bg-[rgba(255,51,51,0.05)]'
          }`}
        >
          <div className="flex items-start">
            <span className={`text-xs font-bold mr-3 mt-1 ${
              results.centerOfGravity.stable ? 'text-[var(--tech-accent)]' : 'text-[var(--tech-error)]'
            }`}>
              {results.centerOfGravity.stable ? '[ PASS ]' : '[ FAIL ]'}
            </span>
            <div>
              <div className="text-xs font-bold text-[var(--tech-text-main)] uppercase tracking-wider">Center of Gravity</div>
              <div className="text-[10px] text-[var(--tech-text-muted)] mt-1">
                {results.centerOfGravity.stable ? '>> Equilibrium maintained.' : '>> WARNING: Structure unstable.'}
              </div>
            </div>
          </div>
        </div>

        {/* Wall Thickness */}
        <div
          className={`p-3 border ${
            results.wallThickness.ok
              ? 'border-[var(--tech-accent)] bg-[rgba(0,243,255,0.05)]'
              : 'border-[var(--tech-error)] bg-[rgba(255,51,51,0.05)]'
          }`}
        >
          <div className="flex items-start">
            <span className={`text-xs font-bold mr-3 mt-1 ${
              results.wallThickness.ok ? 'text-[var(--tech-accent)]' : 'text-[var(--tech-error)]'
            }`}>
              {results.wallThickness.ok ? '[ PASS ]' : '[ FAIL ]'}
            </span>
            <div>
              <div className="text-xs font-bold text-[var(--tech-text-main)] uppercase tracking-wider">Structural Integrity</div>
              <div className="text-[10px] text-[var(--tech-text-muted)] mt-1">
                {results.wallThickness.ok 
                  ? '>> Wall thickness within nominal parameters.' 
                  : `>> CRITICAL: Walls too thin (${results.wallThickness.min}mm < 1.5mm).`}
              </div>
            </div>
          </div>
        </div>

        {/* Overhang Angle */}
        <div
          className={`p-3 border ${
            results.overhangAngle.ok
              ? 'border-[var(--tech-accent)] bg-[rgba(0,243,255,0.05)]'
              : 'border-[var(--tech-error)] bg-[rgba(255,51,51,0.05)]'
          }`}
        >
          <div className="flex items-start">
            <span className={`text-xs font-bold mr-3 mt-1 ${
              results.overhangAngle.ok ? 'text-[var(--tech-accent)]' : 'text-[var(--tech-error)]'
            }`}>
              {results.overhangAngle.ok ? '[ PASS ]' : '[ WARN ]'}
            </span>
            <div>
              <div className="text-xs font-bold text-[var(--tech-text-main)] uppercase tracking-wider">Printability Index</div>
              <div className="text-[10px] text-[var(--tech-text-muted)] mt-1">
                {results.overhangAngle.ok 
                  ? '>> Overhangs support-free.' 
                  : `>> CAUTION: Overhang ${results.overhangAngle.max}° exceeds 45° limit.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
