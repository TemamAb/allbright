import React from 'react';

interface MarketSentimentProps {
  params: {
    baseInclusionProb: number;
    bribeElasticity: number;
    competitiveFactor: number;
  };
}

/**
 * Market Sentiment Gauge
 * Visualizes the Alpha-Copilot's internal auction theory parameters.
 * High Competitive Factor indicates an aggressive "War-time" bidding state.
 */
export const MarketSentiment: React.FC<MarketSentimentProps> = ({ params }) => {
  const aggressionLevel = params.competitiveFactor > 1.5 ? 'CRITICAL' : 
                         params.competitiveFactor > 1.1 ? 'ACTIVE' : 'STABLE';

  const colorMap = {
    CRITICAL: 'text-red-400',
    ACTIVE: 'text-amber-400',
    STABLE: 'text-emerald-400'
  };

  return (
    <div className={`grid grid-cols-3 gap-4 p-4 bg-white/5 border rounded-xl backdrop-blur-md transition-colors duration-500 ${aggressionLevel === 'CRITICAL' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}>
      <div className="text-center">
        <div className="text-[10px] text-white/40 uppercase font-bold">Aggression</div>
        <div className={`text-lg font-mono font-black ${colorMap[aggressionLevel]}`}>
          {aggressionLevel}
        </div>
      </div>
      <div className="text-center border-x border-white/10">
        <div className="text-[10px] text-white/40 uppercase font-bold">Bribe Elasticity</div>
        <div className="text-lg font-mono text-white">
          {(params.bribeElasticity * 100).toFixed(1)}%
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] text-white/40 uppercase font-bold">Base Inclusion</div>
        <div className="text-lg font-mono text-white">
          {(params.baseInclusionProb * 100).toFixed(0)}%
        </div>
      </div>
      <div className="col-span-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${aggressionLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${(params.competitiveFactor / 2) * 100}%` }}
        />
      </div>
    </div>
  );
};