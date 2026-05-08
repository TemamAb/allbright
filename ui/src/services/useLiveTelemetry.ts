import { useEngine, type SharedEngineState } from "../stores/engine";

/**
 * useLiveTelemetry
 * Web deployment adapter over the canonical engine store.
 */
export function useLiveTelemetry(): {
  state: SharedEngineState | null;
  isConnected: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { engine, isConnected, error, refresh } = useEngine();

  return {
    state: engine,
    isConnected,
    error,
    refetch: refresh,
  };
}
