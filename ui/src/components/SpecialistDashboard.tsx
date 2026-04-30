import React from 'react';
import { Brain, Shield, TrendingUp, Activity, Cpu, Zap, Settings } from "lucide-react";
import { motion } from "framer-motion";

const SpecialistDashboard: React.FC = () => {
  const specialists = [
    { name: 'Profitability', status: 'green', score: 98, icon: TrendingUp },
    { name: 'Risk', status: 'green', score: 99, icon: Shield },
    { name: 'Efficiency', status: 'green', score: 96, icon: Cpu },
    { name: 'Health', status: 'green', score: 100, icon: Activity },
    { name: 'Performance', status: 'yellow', score: 92, icon: Zap },
    { name: 'AutoOpt', status: 'green', score: 97, icon: Brain },
    { name: 'Dashboard', status: 'yellow', score: 94, icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-grafana-green ring-grafana-green/20';
      case 'yellow': return 'bg-grafana-yellow ring-grafana-yellow/20';
      case 'red': return 'bg-grafana-red ring-grafana-red/20';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {specialists.map((spec, index) => (
        <motion.div 
          key={spec.name} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: index * 0.1 }}
          className="bg-grafana-panel border border-grafana-ash rounded-2xl p-10 shadow-2xl hover:border-grafana-ash-light hover:shadow-grafana-glow/50 transition-all group relative overflow-hidden hover:shadow-xl"
        >
          <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity ${getStatusColor(spec.status)}`} />
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-4 mx-auto mb-6 flex items-center justify-center shadow-lg ring-4 ring-transparent group-hover:ring-primary/30 transition-all ${getStatusColor(spec.status)}`}>
            <spec.icon size={32} className="text-white drop-shadow-lg" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 text-center">{spec.name}</h3>
          <div className="text-4xl font-black text-white mb-2 text-center drop-shadow-lg">
            {spec.score}%
          </div>
          <div className="text-lg text-gray-400 text-center">Optimal</div>
          <button className="w-full mt-6 py-3 bg-primary/20 hover:bg-primary/40 border border-primary/30 text-primary text-lg font-bold rounded-xl transition-all group-hover:scale-[1.02]">
            Tune Now
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default SpecialistDashboard;

