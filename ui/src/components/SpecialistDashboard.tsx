import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface SpecialistStatus {
  name: string;
  status: 'green' | 'yellow' | 'red';
  score: number;
  lastTune: string;
}

const SpecialistDashboard: React.FC = () => {
  const { data: statuses } = useQuery<SpecialistStatus[]>({
    queryKey: ['specialist-statuses'],
    queryFn: async () => {
      // Mock data - replace with API call to /api/copilot/specialists
      return [
        { name: 'Profitability', status: 'green' as const, score: 96, lastTune: '2m ago' },
        { name: 'Risk', status: 'yellow' as const, score: 88, lastTune: '5m ago' },
        { name: 'Efficiency', status: 'green' as const, score: 94, lastTune: '1m ago' },
        { name: 'Health', status: 'green' as const, score: 99, lastTune: '10s ago' },
        { name: 'Performance', status: 'red' as const, score: 82, lastTune: '15m ago' },
        { name: 'AutoOpt', status: 'green' as const, score: 97, lastTune: '30s ago' },
        { name: 'Dashboard', status: 'yellow' as const, score: 91, lastTune: '3m ago' },
      ];
    },
    refetchInterval: 5000,
  });

  const getStatusColor = (status: SpecialistStatus['status']) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statuses?.map((spec, index) => (
        <div key={index} className="glass-panel p-4 rounded-lg border hover:shadow-neon">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(spec.status)} animate-pulse`} />
            <h3 className="font-semibold text-slate-200">{spec.name}</h3>
          </div>
          <div className="text-2xl font-bold text-primary">{spec.score}%</div>
          <div className="text-xs text-slate-500 mt-1">Last tune: {spec.lastTune}</div>
          <button className="mt-2 w-full py-1 px-2 bg-primary/20 hover:bg-primary/40 text-xs rounded text-primary transition-all">
            Tune
          </button>
        </div>
      ))}
    </div>
  );
};

export default SpecialistDashboard;

