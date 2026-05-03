import { useQuery } from "@tanstack/react-query";

interface AutoOptimizerStatus {
  isActive: boolean;
  lastOptimization: string | null;
  nextOptimization: string | null;
  optimizationCyclesPerHour: number;
  improvementDeltaBps: number;
  
  // 27 KPIs metrics
  dailyProfitEth: number;
  avgProfitPerTradeEth: number;
  arbExecutionCount: number;
  
  solverLatencyP99Ms: number;
  throughputMsgS: number;
  successRate: number;
  
  lossRate: number;
  drawdownLimitEth: number;
  competitiveCollisionRate: number;
  
  gasEfficiency: number;
  liquidityHitRate: number;
  slippageCaptureBps: number;
  
  uptimePercent: number;
  cycleAccuracyPercent: number;
  pnlVolatilityEth: number;
}

/**
 * Hook to fetch the auto-optimizer status from the API
 */
export function useGetAutoOptimizerStatus(options: {
  query?: {
    refetchInterval?: number;
    queryKey: unknown[];
  };
}) {
  const { query } = options || {};

  return useQuery<AutoOptimizerStatus, Error>({
    queryKey: query?.queryKey ?? ["auto-optimizer-status"],
    queryFn: async () => {
      const response = await fetch(`/api/auto-optimizer/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch auto-optimizer status: ${response.status}`);
      }

      return response.json();
    },
    refetchInterval: query?.refetchInterval ?? 5000,
    staleTime: 10000,
  });
}
