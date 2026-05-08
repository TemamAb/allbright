import { useEngine } from "../stores/engine";

export function useTelemetry() {
  const { telemetry, isLive, refresh } = useEngine();

  return {
    kpis: telemetry,
    isLive,
    refetch: refresh,
  };
}
