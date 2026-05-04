// ui/src/types/rpc.ts

export interface RpcHealthMetric {
  id: string; // Unique identifier for the RPC provider (e.g., "alchemy-us-east")
  url: string; // The RPC endpoint URL
  is_healthy: boolean; // True if the RPC is currently considered healthy
  current_latency_ms: number; // Average latency in milliseconds over a short window
  error_rate: number; // Error rate (0.0 to 1.0) over a short window
  last_block_number: number; // Last block number successfully fetched from this RPC
  consecutive_failures: number; // Count of consecutive failed probes
}

export interface RpcHealthReport {
  timestamp: string; // ISO 8601 timestamp when this report was generated
  overall_status: "healthy" | "degraded" | "unhealthy" | "unknown"; // Aggregate status
  active_rpc_count: number; // Number of currently healthy RPCs
  total_rpc_count: number; // Total number of configured RPCs
  metrics: RpcHealthMetric[]; // Array of individual RPC health metrics
}