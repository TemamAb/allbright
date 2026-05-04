import { useState, useEffect, useCallback } from 'react';
import type { FullKPIState, KPI } from '../types/kpi';
import { THIRTY_SIX_KPIS } from '../constants/kpi';

const INITIAL_STATE: FullKPIState = {
  categories: {},
  ges: 76.8,
  timestamp: new Date(),
};

// Initialize with mock data from THIRTY_SIX_KPIS
Object.values(THIRTY_SIX_KPIS).forEach((cat) => {
  INITIAL_STATE.categories[cat.id] = cat.kpis as KPI[];
});

export function useTelemetry() {
  const [kpis, setKpis] = useState<FullKPIState>(INITIAL_STATE);
  const [isLive, setIsLive] = useState(false);

  // Update handler for live data
  const handleTelemetryUpdate = useCallback((data: any) => {
    setKpis((prev) => ({
      ...prev,
      categories: data.categories || prev.categories,
      ges: data.ges ?? prev.ges,
      timestamp: new Date(data.timestamp || Date.now()),
    }));
    setIsLive(true);
  }, []);

  // Simulated WebSocket effect - in production, connect to actual backend
  useEffect(() => {
    // Simulate initial data load
    const interval = setInterval(() => {
      setKpis(prev => ({
        ...prev,
        ges: prev.ges + (Math.random() - 0.5) * 0.1,
        timestamp: new Date(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    kpis,
    isLive,
    refetch: () => {
      // Manual refetch placeholder
    },
  };
}
