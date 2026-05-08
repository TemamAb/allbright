import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FullKPIState, KPI } from "../types/kpi";
import { FORTY_FOUR_KPIS } from "../constants/kpi";
import {
  apiFetch,
  type EngineStatusResponse,
  type TelemetryResponse,
  type TradesSummary,
} from "../lib/api";

/**
 * Engine State Store
 * Web deployment source of truth for engine telemetry, KPIs, and operator status.
 */

export interface SharedEngineState extends EngineStatusResponse {
  aiEpisodes?: number;
  profitMomentum?: number;
  currentDailyProfit?: number;
  avgLatencyMs?: number;
  winRate?: number;
  currentUserRole?: string;
  pendingWithdrawals?: Array<{
    id: string;
    amountEth: number;
    chainId: number;
    status: string;
    timestamp: string;
    toAddress?: string;
  }>;
  marketPulse?: {
    latestAlphaReasoning?: string;
  };
  specialistRegistry?: Array<{
    id: string;
    name: string;
    status: string;
    health: number;
  }>;
  anomalyLog?: string[];
}

export interface EngineStoreValue {
  engine: SharedEngineState | null;
  telemetry: FullKPIState;
  telemetryFeed: TelemetryResponse | null;
  summary: TradesSummary | null;
  isConnected: boolean;
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date;
  refresh: () => Promise<void>;
}

const INITIAL_TELEMETRY: FullKPIState = {
  categories: FORTY_FOUR_KPIS.reduce(
    (acc, cat) => {
      acc[cat.id] = cat.kpis;
      return acc;
    },
    {} as Record<string, KPI[]>,
  ),
  ges: 0,
  timestamp: new Date(),
};

const EngineContext = createContext<EngineStoreValue | null>(null);

function cloneTelemetryBaseline(): Record<string, KPI[]> {
  return FORTY_FOUR_KPIS.reduce(
    (acc, cat) => {
      acc[cat.id] = cat.kpis.map((kpi) => ({ ...kpi }));
      return acc;
    },
    {} as Record<string, KPI[]>,
  );
}

function setKpiValue(
  categories: Record<string, KPI[]>,
  categoryId: string,
  kpiId: string,
  value: number | string,
) {
  const category = categories[categoryId];
  if (!category) return;

  const kpi = category.find((item) => item.id === kpiId);
  if (kpi) {
    kpi.value = value;
  }
}

function calculateGes(engine: EngineStatusResponse | null): number {
  if (!engine) return 0;
  if (typeof engine.totalWeightedScore === "number") {
    return Number(engine.totalWeightedScore);
  }

  const scores = engine.domainScores;
  if (!scores) return 0;

  return (
    (Number(scores.eff || 0) * 0.2) +
    (Number(scores.perf || 0) * 0.25) +
    (Number(scores.health || 0) * 0.15) +
    (Number(scores.risk || 0) * 0.2) +
    (Number(scores.autoOpt || 0) * 0.1) +
    (Number(scores.profit || 0) * 0.1)
  );
}

function buildTelemetryState(
  engine: EngineStatusResponse | null,
  telemetryFeed: TelemetryResponse | null,
  summary: TradesSummary | null,
): FullKPIState {
  const categories = cloneTelemetryBaseline();
  const ges = calculateGes(engine);

  if (telemetryFeed) {
    setKpiValue(
      categories,
      "efficiency",
      "execution-speed",
      telemetryFeed.avgLatencyMs ?? 0,
    );
    setKpiValue(
      categories,
      "efficiency",
      "cross-chain-latency",
      Math.max(
        telemetryFeed.queryLatencyMs ?? 0,
        ...Object.values(telemetryFeed.chainMatrix?.latencies || {}),
      ),
    );

    setKpiValue(
      categories,
      "performance",
      "blocks-scanned",
      telemetryFeed.blocksScanned ?? 0,
    );
    setKpiValue(
      categories,
      "performance",
      "opportunities-detected",
      telemetryFeed.opportunitiesDetected ?? 0,
    );
    setKpiValue(
      categories,
      "performance",
      "opportunities-executed",
      telemetryFeed.opportunitiesExecuted ?? 0,
    );
    setKpiValue(
      categories,
      "performance",
      "profit-generated",
      telemetryFeed.sessionProfitUsd ?? 0,
    );
    setKpiValue(
      categories,
      "performance",
      "uptime",
      engine?.running ? 100 : 0,
    );

    setKpiValue(categories, "health", "memory-usage", telemetryFeed.memoryUsageMb ?? 0);
    setKpiValue(categories, "health", "cpu-usage", telemetryFeed.cpuPercent ?? 0);
    setKpiValue(
      categories,
      "health",
      "network-latency",
      telemetryFeed.queryLatencyMs ?? 0,
    );
    setKpiValue(
      categories,
      "health",
      "error-rate",
      engine?.consecutiveFailures ? Math.min(engine.consecutiveFailures, 100) : 0,
    );
    setKpiValue(
      categories,
      "health",
      "health-checks-passed",
      engine?.scannerActive ? 10 : 6,
    );

    setKpiValue(
      categories,
      "cloud",
      "api-latency",
      telemetryFeed.queryLatencyMs ?? 0,
    );
  }

  if (summary) {
    setKpiValue(
      categories,
      "performance",
      "success-rate",
      summary.successRate ?? 0,
    );
  }

  if (engine) {
    setKpiValue(
      categories,
      "risk",
      "operational-risk",
      engine.consecutiveFailures ?? 0,
    );
    setKpiValue(
      categories,
      "auto-optimization",
      "auto-optimizations-applied",
      engine.aiSpecialistSummary?.active ?? 0,
    );
    setKpiValue(
      categories,
      "auto-optimization",
      "convergence-rate",
      Math.max(0, Math.min(100, ges)),
    );
  }

  return {
    categories,
    ges,
    timestamp: new Date(),
  };
}

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [engineState, setEngineState] = useState<SharedEngineState | null>(null);
  const [telemetry, setTelemetry] = useState<FullKPIState>(INITIAL_TELEMETRY);
  const [telemetryFeed, setTelemetryFeed] = useState<TelemetryResponse | null>(null);
  const [summary, setSummary] = useState<TradesSummary | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncEngine = useCallback(async () => {
    try {
      const [engine, feed, tradeSummary] = await Promise.all([
        apiFetch<EngineStatusResponse>("/api/engine/status"),
        apiFetch<TelemetryResponse>("/api/telemetry"),
        apiFetch<TradesSummary>("/api/trades/summary"),
      ]);

      const nextEngineState: SharedEngineState = {
        ...engine,
        aiEpisodes: engine.aiSpecialistSummary?.total ?? 0,
        profitMomentum:
          feed.tradesPerHour > 0
            ? feed.sessionProfitEth / Math.max(feed.tradesPerHour, 1)
            : 0,
        currentDailyProfit: feed.sessionProfitUsd ?? tradeSummary.sessionProfitUsd,
        avgLatencyMs: feed.avgLatencyMs,
        winRate:
          typeof tradeSummary.successRate === "number"
            ? tradeSummary.successRate / 100
            : undefined,
        marketPulse: {
          latestAlphaReasoning: feed.intelligence?.alphaReasoning,
        },
        anomalyLog:
          feed.intelligence?.performanceGaps?.map(
            (gap) =>
              `${gap.subsystem}: ${gap.kpi} at ${gap.operational} vs target ${gap.design} (${gap.gap})`,
          ) ?? [],
        specialistRegistry: engine.aiSpecialistSummary
          ? [
              {
                id: "active",
                name: "Active Specialists",
                status: "ACTIVE",
                health: Math.round(
                  (engine.aiSpecialistSummary.active /
                    Math.max(engine.aiSpecialistSummary.total, 1)) *
                    100,
                ),
              },
              {
                id: "inactive",
                name: "Inactive Specialists",
                status: "IDLE",
                health: Math.round(
                  (engine.aiSpecialistSummary.inactive /
                    Math.max(engine.aiSpecialistSummary.total, 1)) *
                    100,
                ),
              },
            ]
          : [],
        pendingWithdrawals: [],
      };

      setEngineState(nextEngineState);
      setTelemetryFeed(feed);
      setSummary(tradeSummary);
      setTelemetry(buildTelemetryState(nextEngineState, feed, tradeSummary));
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Engine sync failed:", err);
      setError(String(err));
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncEngine();
    const interval = setInterval(syncEngine, 5000);
    return () => clearInterval(interval);
  }, [syncEngine]);

  const value = useMemo(
    () => ({
      engine: engineState,
      telemetry,
      telemetryFeed,
      summary,
      isConnected,
      isLive: isConnected && !!engineState?.running,
      isLoading,
      error,
      lastUpdate: telemetry.timestamp || new Date(),
      refresh: syncEngine,
    }),
    [
      engineState,
      telemetry,
      telemetryFeed,
      summary,
      isConnected,
      isLoading,
      error,
      syncEngine,
    ],
  );

  return React.createElement(
    EngineContext.Provider,
    { value },
    children,
  );
}

export function useEngine() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngine must be used within an EngineProvider");
  }
  return context;
}
