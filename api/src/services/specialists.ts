import { sharedEngineState } from './engineState';

// KPI Specialist Interfaces (from ai/agents/kpi-specialists.md)
export interface Specialist {
  name: string;
  category: string;
  tuneKpis(kpiData: any): Promise<any>;
  status(): Promise<any>;
}

/**
 * Internal helper to log system-wide anomalies detected by AI specialists.
 */
function logAnomaly(category: string, message: string) {
  const entry = `[${category}] ${message}`;
  if (!sharedEngineState.anomalyLog.includes(entry)) {
    sharedEngineState.anomalyLog.unshift(entry);
    // Keep a rolling window of the last 20 anomalies for the dashboard feed
    if (sharedEngineState.anomalyLog.length > 20) sharedEngineState.anomalyLog.pop();
  }
}

// Stub implementations (extend with real logic/AI calls)
export class ProfitabilitySpecialist implements Specialist {
  name = 'ProfitabilitySpecialist';
  category = 'Profitability';
async tuneKpis(data: any) {
    const { tradingAI } = await import('@workspace/lib/ts/ai-agent');
    const marketData = {
      symbol: 'ARB',
      price: data.avgPrice || 0.8,
      volume: data.volume || 1e6,
      change24h: data.nrpChange || 0,
    };
    const analysis = await tradingAI.analyzeMarket(marketData);
    const targetNrp = 22.5 + (analysis.confidence / 100) * 2.5; // Boost target based on confidence
    logAnomaly('PROFIT', `Analysis: ${analysis.reasoning.substring(0,100)}`);
    return { tuned: true, nrp_target: targetNrp, analysis };
  }
  async status() { return { active: true }; }
}

export class PerformanceSpecialist implements Specialist {
  name = 'PerformanceSpecialist';
  category = 'Performance';
  async tuneKpis(data: any) { 
    const latency = data.avgLatencyMs || sharedEngineState.avgLatencyMs;
    if (latency > 100) {
      logAnomaly('PERF', `High latency detected: ${latency.toFixed(2)}ms. Potential RPC bottleneck.`);
    }
    return { tuned: true, latency_p99: 12 }; 
  }
  async status() { return { active: true }; }
}

export class EfficiencySpecialist implements Specialist {
  name = 'EfficiencySpecialist';
  category = 'Efficiency';
  async tuneKpis(data: any) { 
    return { tuned: true, gas_eff: 96.5 }; 
  }
  async status() { return { active: true }; }
}

export class RiskSpecialist implements Specialist {
  name = 'RiskSpecialist';
  category = 'Risk';
  async tuneKpis(data: any) { 
    if (data.riskIndex > 0.05) {
      logAnomaly('RISK', `Risk index elevated: ${data.riskIndex.toFixed(3)}. Reviewing protective buffers.`);
    }
    return { tuned: true, mev_deflect: 99.9 }; 
  }
  async status() { return { active: true }; }
}

export class HealthSpecialist implements Specialist {
  name = 'HealthSpecialist';
  category = 'System Health';
  async tuneKpis(data: any) { return { tuned: true, uptime: 100 }; }
  async status() { return { active: true }; }
}

export class AutoOptSpecialist implements Specialist {
  name = 'AutoOptSpecialist';
  category = 'Auto Optimization';
  async tuneKpis(data: any) { return { tuned: true, opt_cycles: 'hourly' }; }
  async status() { return { active: true }; }
}

export class DashboardSpecialist implements Specialist {
  name = 'DashboardSpecialist';
  category = 'Dashboard';
  async tuneKpis(data: any) { return { tuned: true, anomalies: [] }; }
  async status() { return { active: true }; }
}

export class BribeOptimizationSpecialist implements Specialist {
  name = 'BribeOptimizationSpecialist';
  category = 'Bribe Optimization';

  async tuneKpis(kpiData: any) {
    // Analyze bribe performance and tune auction parameters
    const { BrightSkyBribeEngine } = await import('./bribeEngine');

    // Get current performance metrics
    const successRate = kpiData.successRate || 0.85;
    const avgBribeRatio = kpiData.avgBribeRatio || 0.05;
    const inclusionRate = kpiData.inclusionRate || 0.92;

    // Calculate optimal auction parameters based on performance
    const baseInclusionProb = Math.max(0.05, inclusionRate - 0.1); // Conservative baseline
    const bribeElasticity = Math.min(0.1, Math.max(0.01, 0.05 + (1 - successRate) * 0.03));
    const competitiveFactor = Math.min(2.0, Math.max(0.5, 1.0 + (0.05 - avgBribeRatio) * 10));

    if (competitiveFactor > 1.5) {
      logAnomaly('BRIBE', `Market competition intense (Factor: ${competitiveFactor.toFixed(2)}). Escalating bribe strategy.`);
    }

    // Update auction parameters
    BrightSkyBribeEngine.updateAuctionParams(
      baseInclusionProb,
      bribeElasticity,
      0.95, // Keep max inclusion prob stable
      competitiveFactor
    );

    return {
      tuned: true,
      auctionParams: {
        baseInclusionProb,
        bribeElasticity,
        competitiveFactor
      },
      recommendations: {
        baseInclusionProb: `${(baseInclusionProb * 100).toFixed(1)}%`,
        bribeElasticity: `${(bribeElasticity * 100).toFixed(2)}% per 1% bribe increase`,
        competitiveFactor: competitiveFactor.toFixed(2)
      }
    };
  }

  async status() {
    const { BrightSkyBribeEngine } = await import('./bribeEngine');

    try {
      const auctionParams = BrightSkyBribeEngine.getAuctionParams();
      return {
        active: true,
        auctionParams,
        model: 'auction_theory_v1',
        lastTuned: Date.now()
      };
    } catch (err) {
      return {
        active: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        model: 'auction_theory_v1'
      };
    }
  }
}

export const specialists = [
  new ProfitabilitySpecialist(),
  new PerformanceSpecialist(),
  new EfficiencySpecialist(),
  new RiskSpecialist(),
  new HealthSpecialist(),
  new AutoOptSpecialist(),
  new DashboardSpecialist(),
  new BribeOptimizationSpecialist()
];
