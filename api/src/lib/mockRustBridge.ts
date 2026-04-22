import { sharedEngineState } from './engineState';
import { logger } from './logger';

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

