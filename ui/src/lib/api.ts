import { useQuery, useMutation, useQueryClient, useSuspenseQuery, QueryFunction, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

// Base API client
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${endpoint}: ${res.status}`);
  return res.json();
}

// Trade Stream Hook
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

export function useGetTradeStream(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['trade-stream'],
    queryFn: () => apiFetch<TradeStreamResponse>('/api/stream/trades'),
    refetchInterval: query?.refetchInterval,
  });
}

// Trade interfaces
export interface Trade {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  status: 'pending' | 'filled' | 'failed';
  profit?: string;
  bribePaid?: string;
  latencyMs?: number;
  txHash?: string;
}

export interface TradesSummary {
  totalTrades: number;
  totalVolume: string;
  profitable: number;
  successRate?: number;
  avgLatencyMs?: number;
}

// Trades Hook
export function useGetTrades(query?: { refetchInterval?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trades', query?.limit],
    queryFn: () => apiFetch<{ trades: Trade[] }>(`/api/trades/activity${query?.limit ? `?limit=${query.limit}` : ''}`),
    refetchInterval: query?.refetchInterval,
  });
}

export function useGetTradesSummary(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['trades-summary'],
    queryFn: () => apiFetch<TradesSummary>('/api/trades/summary'),
    refetchInterval: query?.refetchInterval,
  });
}

// Engine Status Hook (replaces useGetEngineStatus)
export function useGetEngineStatus() {
  return useQuery({
    queryKey: ['engine-status'],
    queryFn: () => apiFetch<{ running: boolean; mode: string }>('/api/engine/status'),
    refetchInterval: 2000,
  });
}

// Wallet interfaces
export interface Wallet {
  address: string;
  chain: string;
  balance: string;
}

// Wallets Hook
export function useWallets(query?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiFetch<{ wallets: Wallet[] }>('/api/wallets'),
    refetchInterval: query?.refetchInterval,
  });
}

// Balance Fetch (for wallets)
export function useWalletBalance(address: string, chain: string) {
  return useQuery({
    queryKey: ['wallet-balance', address, chain],
    queryFn: () => apiFetch('/api/balance', {
      method: 'POST',
      body: JSON.stringify({ wallet: address, chain }),
    }),
    enabled: !!address && !!chain,
  });
}

// Generic Hook Factory
export function useApiQuery<TData = unknown>(
  key: string[],
  queryFn: () => Promise<TData>,
  options = {}
) {
  return useQuery({ queryKey: key, queryFn, ...options });
}

// Mutation
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, unknown, TVariables> = {}
): UseMutationResult<TData, unknown, TVariables> {
  return useMutation({ mutationFn, ...options });
}

// Set global base (legacy)
export function setBaseUrl(url: string) {
  if (import.meta.env.DEV) console.log('[API] Base URL set:', url);
}

// Types
export interface EngineStatus {
  running: boolean;
  mode: 'STOPPED' | 'SHADOW' | 'LIVE';
}

// Examples
export function useCopilotCommand() {
  return useApiMutation(
    (command: string) => apiFetch('/api/copilot/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
  );
}

