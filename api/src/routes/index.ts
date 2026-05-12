import { Router } from 'express';
import healthRouter from '../controllers/health';
import engineRouter from '../controllers/engine';
import telemetryRouter from '../controllers/telemetry';
import tradesRouter from '../controllers/trades';
import walletRouter from '../controllers/wallet';

const router = Router();

router.use('/health', healthRouter);
router.use('/engine', engineRouter);
router.use('/telemetry', telemetryRouter);
router.use('/trades', tradesRouter);
router.use('/wallet', walletRouter);

// Auto-optimizer was removed - using AI Optimizer component instead

router.get('/', (req, res) => {
  res.json({ status: 'API routes active', timestamp: new Date().toISOString() });
});

export default router;

