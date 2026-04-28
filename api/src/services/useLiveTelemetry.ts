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
 * Manages high-frequency WebSocket synchronization with the BrightSky backbone.
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
          
          // Update history buffer for real-time charts (keep last 30 points)
          setHistory(prev => {
            const newPoint = {
              time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              profit: message.payload.currentDailyProfit || 0,
              predictedProfit: (message.payload.currentDailyProfit || 0) * (1 + (message.payload.simParityDeltaBps || 0) / 10000),
              opportunities: message.payload.opportunitiesDetected || 0
            };
            return [...prev, newPoint].slice(-30);
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
    history
  };
}