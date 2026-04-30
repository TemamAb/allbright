import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../App';
import type { FullKPIState, KPI } from '../types/kpi';
import { THIRTY_SIX_KPIS } from '../types/kpi';

const INITIAL_STATE: FullKPIState = {
  categories: {},
  ges: 76.8,
  timestamp: new Date(),
};

// Initialize with mock data from THIRTY_SIX_KPIS
Object.values(THIRTY_SIX_KPIS).forEach((cat) => {
  INITIAL_STATE.categories![cat.id] = cat.kpis as KPI[];
});

export function useTelemetry() {
  const [kpis, setKpis] = useState<FullKPIState>(INITIAL_STATE);
  const [isLive, setIsLive] = useState(false);
  const { socket } = useSocket();

  // Update handler for live data
  const handleTelemetryUpdate = useCallback((data: any) => {
    console.log('[Telemetry] Live update:', data);
    setKpis((prev) => ({
      ...prev,
      categories: data.categories || prev.categories,
      ges: data.ges ?? prev.ges,
      timestamp: new Date(data.timestamp || Date.now()),
    }));
    setIsLive(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for telemetry events (extend backend to emit 'telemetryKpis')
    socket.on('engineStateFull', handleTelemetryUpdate);
    socket.on('telemetryKpis', handleTelemetryUpdate);

    return () => {
      socket.off('engineStateFull', handleTelemetryUpdate);
      socket.off('telemetryKpis', handleTelemetryUpdate);
    };
  }, [socket, handleTelemetryUpdate]);

  return {
    kpis,
    isLive,
    refetch: () => {
      // Future: API poll fallback
      console.log('[Telemetry] Manual refetch');
    },
  };
}

