import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { FullKPIState, KPI } from '../types/kpi';
import { FORTY_FOUR_KPIS } from '../constants/kpi';

/**
 * Engine State Store
 * Manages real-time engine telemetry, KPIs, and system status
 */

export interface SharedEngineState {
  running: boolean;
  totalWeightedScore: number;
  currentDailyProfit?: number;
  avgLatencyMs?: number;
  winRate?: number;
  riskIndex?: number;
  specialistRegistry?: Array<{
    id: string;
    name: string;
    status: string;
    health: number;
  }>;
  anomalyLog?: string[];
  [key: string]: unknown;
}

export interface EngineStoreValue {
  engine: SharedEngineState | null;
  telemetry: FullKPIState;
  isConnected: boolean;
  isLive: boolean;
  error: string | null;
  lastUpdate: Date;
  refresh: () => Promise<void>;
}

const INITIAL_TELEMETRY: FullKPIState = {
  categories: FORTY_FOUR_KPIS.reduce((acc, cat) => {
    acc[cat.id] = cat.kpis;
    return acc;
  }, {} as { [key: string]: KPI[] }),
  ges: 0,
  timestamp: new Date(),
};

const EngineContext = createContext<EngineStoreValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [engineState, setEngineState] = useState<SharedEngineState | null>(null);
  const [telemetry, setTelemetry] = useState<FullKPIState>(INITIAL_TELEMETRY);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync Engine State from Tauri
  const syncEngine = useCallback(async () => {
    try {
      const state = await invoke<SharedEngineState>('get_engine_state');
      setEngineState(state);
      setIsConnected(true);
      setError(null);

      // Map engine state to telemetry GES if applicable
      if (state.totalWeightedScore !== undefined) {
        setTelemetry(prev => ({
          ...prev,
          ges: state.totalWeightedScore,
          timestamp: new Date(),
        }));
      }
    } catch (err) {
      console.error('Engine sync failed:', err);
      setError(String(err));
      setIsConnected(false);
    }
  }, []);

  // Polling for updates
  useEffect(() => {
    syncEngine();
    const interval = setInterval(syncEngine, 2000);
    return () => clearInterval(interval);
  }, [syncEngine]);

  const value = useMemo(() => ({
    engine: engineState,
    telemetry,
    isConnected,
    isLive: isConnected && !!engineState,
    error,
    lastUpdate: telemetry.timestamp || new Date(),
    refresh: syncEngine,
  }), [engineState, telemetry, isConnected, error, syncEngine]);

  return (
    <EngineContext.Provider value={value}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngine() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return context;
}
