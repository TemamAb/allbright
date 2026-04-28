import { sharedEngineState } from './engineState';
import { logger } from './logger';
import { alphaCopilot } from './alphaCopilot';
import { WebsocketStream } from './websocketStream';

let mockInterval: NodeJS.Timeout | null = null;

export function startMockRustBridge(): void {
  if (mockInterval) return; // Prevent multiple

  logger.info('[MOCK] Starting Rust Bridge simulator for dashboard metrics');

  mockInterval = setInterval(() => {
    // Simulate Rust metrics stream
    sharedEngineState.ipcConnected = true;
    sharedEngineState.shadowModeActive = true;
    sharedEngineState.flashloanContractAddress = '0x1234567890123456789012345678901234567890';

    // Rotating chain latencies
    const chains = [1, 8453, 42161];
    chains.forEach((chain, idx) => {
      sharedEngineState.chainLatencies[chain] = 120 + Math.random() * 40; // 120-160ms
    });

    // Path complexity distribution
    const hops = 2 + Math.floor(Math.random() * 4);
    sharedEngineState.pathComplexity[hops] = (sharedEngineState.pathComplexity[hops] || 0) + 1;

    // Backbone price update
    sharedEngineState.lastBackbonePrice = 3200 + (Math.sin(Date.now() / 10000) * 20); // Simulate volatility

    // Advanced metrics simulation for Phase 4
    sharedEngineState.winRate = 0.92 + Math.random() * 0.05;
    // Simulate occasional performance spikes for anomaly detection
    sharedEngineState.avgLatencyMs = Math.random() > 0.9 ? 115 + Math.random() * 20 : 45 + Math.random() * 10;
    sharedEngineState.riskIndex = Math.random() > 0.95 ? 0.07 : 0.02;

    // Simulate BSS-43 Parity Delta (Prediction vs Reality)
    sharedEngineState.simParityDeltaBps = 150 + (Math.random() * 100); // 1.5% to 2.5% slippage/drift
    
    // Trigger AI tuning cycle to detect anomalies and update policy
    alphaCopilot.fullKpiTuneCycle(sharedEngineState)
      .then(() => WebsocketStream.broadcast())
      .catch(e => logger.error(e, 'AI Cycle failed'));

    // Log occasionally
    if (Math.random() < 0.1) {
      logger.info('[MOCK-RUST] Bridge active: simulated telemetry stream');
    }
  }, 2000); // Every 2s like real Rust
}

export function stopMockRustBridge(): void {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
    logger.info('[MOCK] Rust Bridge simulator stopped');
  }
}
