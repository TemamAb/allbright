import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
} from "@tanstack/react-query";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API ${endpoint}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface TradeEvent {
  id: string;
  type: string;
  message: string;
  timestamp?: string;
  blockNumber?: number;
}

export interface TradeStreamResponse {
  events: TradeEvent[];
}

export interface Trade {
  id: string;
  tokenIn?: string | null;
  tokenOut?: string | null;
  amountIn?: string | null;
  amountOut?: string | null;
  timestamp: string | number;
  status: string;
  profit?: string | null;
  bribePaid?: string | null;
  latencyMs?: number | null;
  txHash?: string | null;
  protocol?: string | null;
}

export interface TradesResponse {
  trades: Trade[];
  total: number;
  limit: number;
  offset: number;
}

export interface TradesSummary {
  totalTrades: number;
  totalProfitEth: number;
  totalProfitUsd: number;
  successRate: number;
  avgProfitPerTrade: number;
  sessionProfitEth: number;
  sessionProfitUsd: number;
  tradesPerHour: number;
  topProtocol: string | null;
  totalBribesPaid: number;
}

export interface WalletAccount {
  id: string;
  address: string;
  chainId: number;
  balanceEth?: number;
  isActive?: boolean;
  isValidated?: boolean;
  source?: string;
  lastSeen?: string;
}

export interface WalletStateResponse {
  wallets: WalletAccount[];
  activeAddress?: string | null;
  ethPriceUsd?: number;
  autoWithdraw?: boolean;
  history?: Array<{
    id: string;
    amountEth: number;
    chainId: number;
    status: string;
    timestamp: string;
  }>;
  liveCapable?: boolean;
}

export interface EngineStatusResponse {
  running: boolean;
  mode: "STOPPED" | "SHADOW" | "LIVE" | string;
  uptime: number;
  walletAddress?: string | null;
  totalWalletBalance?: number;
  gaslessMode?: boolean;
  pimlicoEnabled?: boolean;
  scannerActive?: boolean;
  liveCapable?: boolean;
  opportunitiesDetected?: number;
  opportunitiesExecuted?: number;
  chainId?: number;
  ipcConnected?: boolean;
  onboardingComplete?: boolean;
  shadowModeActive?: boolean;
  flashloanContractAddress?: string | null;
  emergencyOverride?: boolean;
  scanInFlight?: boolean;
  skippedScanCycles?: number;
  circuitBreakerOpen?: boolean;
  consecutiveFailures?: number;
  circuitBreakerUntil?: number | null;
  lastFailureReason?: string | null;
  appName?: string | null;
  logoUrl?: string | null;
  ghostMode?: boolean;
  intelligenceSource?: string | null;
  totalWeightedScore?: number;
  aiSpecialistSummary?: {
    total: number;
    active: number;
    inactive: number;
  };
  clientProfile?: string | null;
  integrityThreshold?: number | null;
  domainScores?: {
    profit?: number;
    risk?: number;
    perf?: number;
    eff?: number;
    health?: number;
    autoOpt?: number;
  };
}

export interface TelemetryResponse {
  sessionProfitEth: number;
  sessionProfitUsd: number;
  tradesPerHour: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
  memoryUsageMb: number;
  cpuPercent: number;
  blocksScanned: number;
  currentBlock?: number;
  ethPriceUsd?: number;
  opportunitiesDetected: number;
  opportunitiesExecuted: number;
  uptimeSeconds: number;
  queryLatencyMs: number;
  profitHistory: Array<{ time: string; eth: number; usd: number }>;
  opportunityHistory?: Array<{ time: string; count: number }>;
  chainMatrix?: {
    activeChains?: number[];
    latencies?: Record<string, number>;
  };
  vault?: {
    totalBalanceEth?: number;
    totalBalanceUsd?: number;
    mode?: string;
  };
  intelligence?: {
    tuning?: unknown;
    learningDelta?: number;
    competitiveOverlapPct?: number;
    alphaReasoning?: string;
    performanceGaps?: Array<{
      subsystem: string;
      kpi: string;
      design: number | string;
      operational: number | string;
      gap: string;
    }>;
    bottleneckReport?: string | null;
  };
  riskConsole?: {
    circuitBreakerOpen?: boolean;
    lastRevertReason?: string;
  };
  dataMode?: string;
  disclaimer?: string;
}

export interface SettingsOverviewResponse {
  success: boolean;
  env: Array<{ key: string; value?: string }>;
  deploymentRegistry?: unknown[];
  ghostMode?: boolean;
  clientProfile?: string | null;
  integrityThreshold?: number | null;
}

export function useGetTradeStream(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["trade-stream"],
    queryFn: () => apiFetch<TradeStreamResponse>("/api/trades/stream"),
    refetchInterval: query?.refetchInterval,
  });
}

export function useGetTrades(query?: {
  refetchInterval?: number;
  limit?: number;
  offset?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["trades", query?.limit, query?.offset, query?.status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.offset) params.set("offset", String(query.offset));
      if (query?.status) params.set("status", query.status);

      const suffix = params.toString() ? `?${params}` : "";
      return apiFetch<TradesResponse>(`/api/trades${suffix}`);
    },
    refetchInterval: query?.refetchInterval,
  });
}

export function useGetTradesSummary(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["trades-summary"],
    queryFn: () => apiFetch<TradesSummary>("/api/trades/summary"),
    refetchInterval: query?.refetchInterval,
  });
}

export function useGetEngineStatus(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["engine-status"],
    queryFn: () => apiFetch<EngineStatusResponse>("/api/engine/status"),
    refetchInterval: query?.refetchInterval ?? 2000,
  });
}

export function useGetTelemetry(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["telemetry"],
    queryFn: () => apiFetch<TelemetryResponse>("/api/telemetry"),
    refetchInterval: query?.refetchInterval ?? 5000,
  });
}

export function useWalletState(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["wallet-state"],
    queryFn: () => apiFetch<WalletStateResponse>("/api/wallet"),
    refetchInterval: query?.refetchInterval ?? 10000,
  });
}

export function useSettingsOverview(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["settings-overview"],
    queryFn: () => apiFetch<SettingsOverviewResponse>("/api/settings"),
    refetchInterval: query?.refetchInterval,
  });
}

export function useApiQuery<TData = unknown>(
  key: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">,
) {
  return useQuery({ queryKey: key, queryFn, ...options });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, unknown, TVariables> = {},
): UseMutationResult<TData, unknown, TVariables> {
  return useMutation({ mutationFn, ...options });
}

export function setBaseUrl(url: string) {
  if (import.meta.env.DEV) {
    console.log("[API] Base URL set:", url);
  }
}

export function useCopilotCommand() {
  return useApiMutation((command: string) =>
    apiFetch("/api/copilot/command", {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  );
}
