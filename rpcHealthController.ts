// api/src/controllers/rpcHealthController.ts
import { Router, Request, Response } from 'express';
import { RustTelemetryService } from '../services/rustTelemetryService';
import { RpcHealthReport } from '../../ui/src/types/rpc'; // Assuming shared types

const router = Router();
const rustTelemetryService = RustTelemetryService.getInstance();

router.get('/v1/rpc-health', async (req: Request, res: Response) => {
  try {
    const rpcHealthReport: RpcHealthReport | null = await rustTelemetryService.getRpcHealthMetrics();

    if (rpcHealthReport) {
      res.json(rpcHealthReport);
    } else {
      res.status(500).json({ error: 'Failed to retrieve RPC health metrics from solver.' });
    }
  } catch (error) {
    console.error('[RpcHealthController] Error fetching RPC health:', error);
    res.status(500).json({ error: 'Internal server error while fetching RPC health.' });
  }
});

export default router;