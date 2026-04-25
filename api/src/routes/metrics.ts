/**
 * Prometheus-style /metrics endpoint (free tier, plaintext)
 */
import { Request, Response } from 'express';
import { sharedEngineState } from '../lib/engineState';

export function getMetrics(req: Request, res: Response): void {
  const uptimeSec = sharedEngineState.startedAt
    ? Math.floor((Date.now() - sharedEngineState.startedAt.getTime()) / 1000)
    : 0;

  const metrics = [
    `# HELP brightsky_engine_running Engine running status (0/1)`,
    `# TYPE brightsky_engine_running gauge`,
    `brightsky_engine_running{ mode="${sharedEngineState.mode}" } ${sharedEngineState.running ? 1 : 0}`,
    `# HELP brightsky_engine_uptime_seconds Seconds since engine start`,
    `# TYPE brightsky_engine_uptime_seconds counter`,
    `brightsky_engine_uptime_seconds ${uptimeSec}`,
    `# HELP brightsky_trades_total Total trades executed`,
    `# TYPE brightsky_trades_total counter`,
    `brightsky_trades_total ${sharedEngineState.opportunitiesExecuted || 0}`,
    `# HELP brightsky_gasless_mode Gasless mode status (0/1)`,
    `# TYPE brightsky_gasless_mode gauge`,
    `brightsky_gasless_mode ${sharedEngineState.gaslessMode ? 1 : 0}`,
    `# HELP brightsky_circuit_breaker_open Circuit breaker status (0/1)`,
    `# TYPE brightsky_circuit_breaker_open gauge`,
    `brightsky_circuit_breaker_open ${sharedEngineState.circuitBreakerOpen ? 1 : 0}`,
  ];

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics.join('\n'));
}
