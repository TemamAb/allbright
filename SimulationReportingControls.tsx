import React from 'react';
import { useSimulationReporter } from '../hooks/useSimulationReporter';

interface Props {
  telemetry: any;
}

export const SimulationReportingControls: React.FC<Props> = ({ telemetry }) => {
  const { 
    isReporting, 
    currentCycle, 
    targetCycle, 
    progress, 
    startReporting, 
    stopReporting 
  } = useSimulationReporter(telemetry);

  const cycleOptions = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="bg-ash-dark border border-ash-border rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white uppercase tracking-wider">
          Simulation Diagnostics & Reporting
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isReporting ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-ash-border text-gray-400'}`}>
          {isReporting ? 'REPORTING ACTIVE' : 'IDLE'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs text-gray-400 uppercase mb-2">Target Run Cycles</label>
          <select 
            disabled={isReporting}
            className="w-full bg-ash-black border border-ash-border rounded p-2 text-white focus:outline-none focus:border-cyan-500"
            value={targetCycle}
            onChange={(e) => startReporting(Number(e.target.value))}
          >
            {cycleOptions.map(opt => (
              <option key={opt} value={opt}>{opt.toLocaleString()} Cycles</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end">
          {!isReporting ? (
            <button 
              onClick={() => startReporting(targetCycle)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition-colors"
            >
              START LIVE REPORT
            </button>
          ) : (
            <button 
              onClick={stopReporting}
              className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600 font-bold py-2 rounded transition-colors"
            >
              ABORT SESSION
            </button>
          )}
        </div>
      </div>

      {isReporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-400">PROGRESS: {currentCycle.toLocaleString()} / {targetCycle.toLocaleString()}</span>
            <span className="text-gray-400">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-ash-black rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};