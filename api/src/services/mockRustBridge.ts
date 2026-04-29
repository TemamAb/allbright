import { sharedEngineState } from './engineState';
import { logger } from './logger';
import { alphaCopilot } from './alphaCopilot';
import { WebsocketStream } from './websocketStream';
import * as crypto from 'crypto';

let mockInterval: NodeJS.Timeout | null = null;
let stateVersion = 0;
let lastChecksum = '';

export function startMockRustBridge(): void {
  if (mockInterval) return; // Prevent multiple

  logger.info('[MOCK] Starting Rust Bridge simulator with state reconciliation');

  mockInterval = setInterval(() => {
    // Increment version for change detection
    stateVersion++;

    // Simulate Rust metrics stream with version control
    const previousState = { ...sharedEngineState };
    sharedEngineState.ipcConnected = true;
    sharedEngineState.shadowModeActive = true;
    sharedEngineState.flashloanContractAddress = '0x1234567890123456789012345678901234567890';

    // Rotating chain latencies with bounds checking
    const chains = [1, 8453, 42161];
    chains.forEach((chain, idx) => {
      sharedEngineState.chainLatencies[chain] = Math.max(1, 120 + (Math.random() - 0.5) * 80); // 40-200ms with bounds
    });

    // Path complexity distribution with validation
    const hops = Math.max(2, Math.min(5, 2 + Math.floor(Math.random() * 4)));
    sharedEngineState.pathComplexity[hops] = (sharedEngineState.pathComplexity[hops] || 0) + 1;

    // Backbone price update with realistic bounds
    sharedEngineState.lastBackbonePrice = Math.max(100, 3200 + (Math.sin(Date.now() / 10000) * 200)); // ±$200 volatility

    // Advanced metrics simulation with validation
    sharedEngineState.winRate = Math.max(0, Math.min(1, 0.92 + (Math.random() - 0.5) * 0.1));
    sharedEngineState.avgLatencyMs = Math.random() > 0.9 ?
      Math.max(1, 115 + (Math.random() - 0.5) * 40) :
      Math.max(1, 45 + (Math.random() - 0.5) * 20);
    sharedEngineState.riskIndex = Math.random() > 0.95 ?
      Math.max(0, Math.min(1, 0.07 + Math.random() * 0.03)) :
      Math.max(0, Math.min(0.1, 0.02 + Math.random() * 0.04));

    // Simulate BSS-43 Parity Delta with bounds
    sharedEngineState.simParityDeltaBps = Math.max(0, 150 + (Math.random() - 0.5) * 200); // 0-350 bps range

    // State reconciliation: compute checksum and detect drift
    const currentChecksum = crypto.createHash('sha256')
      .update(JSON.stringify(sharedEngineState))
      .digest('hex');

    if (currentChecksum !== lastChecksum && lastChecksum !== '') {
      logger.warn('[MOCK-RUST] State drift detected', {
        version: stateVersion,
        previousChecksum: lastChecksum.substring(0, 8),
        currentChecksum: currentChecksum.substring(0, 8)
      });
    }
    lastChecksum = currentChecksum;
    sharedEngineState.stateVersion = stateVersion;
    sharedEngineState.stateChecksum = currentChecksum.substring(0, 16); // Store truncated checksum

    // Trigger AI tuning cycle with error handling
    alphaCopilot.fullKpiTuneCycle(sharedEngineState)
      .then(() => WebsocketStream.broadcast())
      .catch(e => logger.error(e, 'AI Cycle failed - state reconciliation active'));

    // Log with version info
    if (Math.random() < 0.05) { // Reduced frequency
      logger.info('[MOCK-RUST] Bridge active', {
        version: stateVersion,
        checksum: currentChecksum.substring(0, 8),
        ipc: sharedEngineState.ipcConnected
      });
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
