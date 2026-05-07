import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * useLiveTelemetry: Hook for real-time engine state from Tauri backend
 * Provides SharedEngineState and connection status
 */

export interface SharedEngineState {
  running: boolean;
  totalWeightedScore: number;
  marketPulse?: {
    latestAlphaReasoning?: string;
  };
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

export function useLiveTelemetry() {
  const [state, setState] = useState<SharedEngineState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch engine state from Tauri backend
  const fetchState = useCallback(async () => {
    try {
      const engineState = await invoke<SharedEngineState>('get_engine_state');
      setState(engineState);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch engine state:', err);
      setError(String(err));
      setIsConnected(false);
    }
  }, []);

  // Poll for state updates
  useEffect(() => {
    fetchState();
    
    // Poll every 2 seconds for state updates
    const interval = setInterval(fetchState, 2000);
    
    return () => clearInterval(interval);
  }, [fetchState]);

  return {
    state,
    isConnected,
    error,
    refetch: fetchState,
  };
}
