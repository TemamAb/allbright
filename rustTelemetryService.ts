// api/src/services/rustTelemetryService.ts
import net from 'net';
import { RpcHealthReport, RpcHealthMetric } from '../../ui/src/types/rpc'; // Assuming shared types

const UDS_PATH = '/tmp/allbright_solver.sock'; // Must match Rust solver's UDS path

export class RustTelemetryService {
  private static instance: RustTelemetryService;

  private constructor() {}

  public static getInstance(): RustTelemetryService {
    if (!RustTelemetryService.instance) {
      RustTelemetryService.instance = new RustTelemetryService();
    }
    return RustTelemetryService.instance;
  }

  /**
   * Fetches RPC health metrics from the Rust solver via UDS.
   */
  public async getRpcHealthMetrics(): Promise<RpcHealthReport | null> {
    return new Promise((resolve) => {
      const client = net.createConnection({ path: UDS_PATH }, () => {
        client.write('GET_RPC_HEALTH');
      });

      let data = '';
      client.on('data', (chunk) => {
        data += chunk.toString();
      });

      client.on('end', () => {
        try {
          const metrics: { [key: string]: RpcHealthMetric } = JSON.parse(data);
          const report: RpcHealthReport = {
            timestamp: new Date().toISOString(),
            overall_status: 'unknown', // Will be determined by controller
            active_rpc_count: 0,       // Will be determined by controller
            total_rpc_count: Object.keys(metrics).length,
            metrics: Object.values(metrics),
          };
          // Basic status calculation for the report
          const healthyCount = report.metrics.filter(m => m.is_healthy).length;
          report.active_rpc_count = healthyCount;
          if (healthyCount === report.total_rpc_count && report.total_rpc_count > 0) {
            report.overall_status = 'healthy';
          } else if (healthyCount > 0) {
            report.overall_status = 'degraded';
          } else {
            report.overall_status = 'unhealthy';
          }
          resolve(report);
        } catch (error) {
          console.error('[RustTelemetryService] Failed to parse RPC health data:', error);
          resolve(null);
        } finally {
          client.end();
        }
      });

      client.on('error', (err) => {
        console.error(`[RustTelemetryService] UDS connection error: ${err.message}`);
        resolve(null);
      });

      // Set a timeout for the UDS request
      client.setTimeout(2000, () => { // 2 seconds timeout
        console.error('[RustTelemetryService] UDS request timed out.');
        client.destroy();
        resolve(null);
      });
    });
  }
}