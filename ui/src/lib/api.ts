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

// Engine Status Hook (replaces useGetEngineStatus)
export function useGetEngineStatus() {
  return useQuery({
    queryKey: ['engine-status'],
    queryFn: () => apiFetch<{ running: boolean; mode: string }>('/api/engine/status'),
    refetchInterval: 2000,
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

