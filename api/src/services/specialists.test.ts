import { test, expect, describe, vi } from 'vitest';
import { specialists } from './specialists.js';
import * as tradingAI from '@workspace/lib/ts/ai-agent.js';

vi.mock('@workspace/lib/ts/ai-agent.js');

describe('Specialists', () => {
  test('ProfitabilitySpecialist tuneKpis calls TradingAI', async () => {
    const mockAnalysis = { recommendation: 'HOLD', confidence: 85, reasoning: 'Test', riskLevel: 'MEDIUM' };
    tradingAI.tradingAI.analyzeMarket.mockResolvedValue(mockAnalysis);

    const data = { nrp: 20, successRate: 0.9 };
    const result = await specialists[0].tuneKpis(data);

    expect(tradingAI.tradingAI.analyzeMarket).toHaveBeenCalledWith(expect.any(Object));
    expect(result.tuned).toBe(true);
    expect(result.nrp_target).toBeGreaterThan(20);
  });

  test('BribeOptimizationSpecialist updates auction params', async () => {
    const result = await specialists[7].tuneKpis({ successRate: 0.8 });

    expect(result.tuned).toBe(true);
    expect(result.auctionParams).toBeDefined();
  });
});

