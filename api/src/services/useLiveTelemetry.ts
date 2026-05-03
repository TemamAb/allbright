import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedEngineState } from '../../../api/src/services/engineState';

export interface TelemetryHistory {
  time: string;
  profit: number;
  predictedProfit: number;
  opportunities: number;
}

/**
 * Elite-Grade Telemetry Hook
 * Manages high-frequency WebSocket synchronization with the allbright backbone.
 * Handles automatic reconnection, state snapshots, and incremental updates.
 * Maintains a local history buffer for real-time charting.
 */
export function useLiveTelemetry() {
  const [engineState, setEngineState] = useState<SharedEngineState | null>(null);
  const [history, setHistory] = useState<TelemetryHistory[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:10000';
    const socketUrl = `${protocol}//${host}/api/v1/stream`;

    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('[TELEMETRY] Bridge established');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SNAPSHOT' || message.type === 'UPDATE') {
          setEngineState(message.payload);

          // Update history buffer with memory-bounded growth (O(1) space)
          setHistory(prev => {
            // Validate input data to prevent NaN/infinite values
            const profit = Number.isFinite(message.payload.currentDailyProfit) ?
              message.payload.currentDailyProfit : 0;
            const parityDelta = Number.isFinite(message.payload.simParityDeltaBps) ?
              message.payload.simParityDeltaBps : 0;
            const opportunities = Number.isFinite(message.payload.opportunitiesDetected) ?
              message.payload.opportunitiesDetected : 0;

            const newPoint = {
              time: new Date().toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }),
              profit: Math.max(-1000000, Math.min(1000000, profit)), // Clamp to reasonable bounds
              predictedProfit: Math.max(-1000000, Math.min(1000000,
                profit * (1 + parityDelta / 10000))),
              opportunities: Math.max(0, Math.min(10000, opportunities)) // Clamp to reasonable bounds
            };

            // Use efficient array replacement instead of spread to prevent memory leaks
            const newHistory = prev.length >= 30 ? [...prev.slice(1), newPoint] : [...prev, newPoint];
            return newHistory;
          });
        }
      } catch (err) {
        console.error('[TELEMETRY] Parsing error', err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.warn('[TELEMETRY] Bridge lost, attempting recalibration...');
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error('[TELEMETRY] Connection error', err);
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return {
    state: engineState,
    isConnected,
    latency: engineState?.avgLatencyMs || 0,
    history,
    // Calculated field for real-time UI countdowns
    nextOptimizationIn: engineState?.nextOptimizationCycle 
      ? Math.max(0, engineState.nextOptimizationCycle - Math.floor(Date.now() / 1000)) 
      : null
  };
}
