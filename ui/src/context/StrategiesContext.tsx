import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type StrategyId = 'bss-05' | 'bss-13' | 'bss-43' | 'bss-45' | 'bss-42' | 'bss-35';

interface Strategies {
  'bss-05': boolean; // Multi-Chain Sync
  'bss-13': boolean; // Graph Solver
  'bss-43': boolean; // Simulation
  'bss-45': boolean; // Risk Engine
  'bss-42': boolean; // MEV Guard
  'bss-35': boolean; // Gasless Manager
}

const defaultStrategies: Strategies = {
  'bss-05': true,
  'bss-13': true,
  'bss-43': true,
  'bss-45': true,
  'bss-42': true,
  'bss-35': true,
};

interface StrategiesContextType {
  strategies: Strategies;
  toggleStrategy: (id: StrategyId, active: boolean) => void;
  isActive: (id: StrategyId) => boolean;
}

const StrategiesContext = createContext<StrategiesContextType | null>(null);

export function StrategiesProvider({ children }: { children: ReactNode }) {
  const [strategies, setStrategies] = useState<Strategies>(defaultStrategies);

  const toggleStrategy = useCallback((id: StrategyId, active: boolean) => {
    setStrategies(prev => ({ ...prev, [id]: active }));
  }, []);

  const isActive = useCallback((id: StrategyId) => {
    return strategies[id] ?? true;
  }, [strategies]);

  return (
    <StrategiesContext.Provider value={{ strategies, toggleStrategy, isActive }}>
      {children}
    </StrategiesContext.Provider>
  );
}

export const useStrategies = () => {
  const ctx = useContext(StrategiesContext);
  if (!ctx) throw new Error('useStrategies must be used within StrategiesProvider');
  return ctx;
};
