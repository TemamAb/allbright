import { Router, type IRouter, type Request, type Response } from "express";
import { AutoOptimizerService } from "../services/autoOptimizerService";

const router: IRouter = Router();

// Initialize the auto-optimizer service
const autoOptimizerService = new AutoOptimizerService();

/**
 * GET /api/auto-optimizer/status
 * Returns the current status and metrics of the auto-optimizer
 */
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const status = await autoOptimizerService.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching auto-optimizer status:", error);
    res.status(500).json({ 
      error: "Failed to fetch auto-optimizer status",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/auto-optimizer/trigger
 * Manually triggers an optimization cycle
 */
router.post("/trigger", async (_req: Request, res: Response) => {
  try {
    const result = await autoOptimizerService.triggerOptimization();
    res.json(result);
  } catch (error) {
    console.error("Error triggering auto-optimizer:", error);
    res.status(500).json({ 
      error: "Failed to trigger auto-optimizer",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/auto-optimizer/configure
 * Updates the auto-optimizer configuration
 */
router.post("/configure", async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const result = await autoOptimizerService.updateConfiguration(config);
    res.json(result);
  } catch (error) {
    console.error("Error configuring auto-optimizer:", error);
    res.status(500).json({ 
      error: "Failed to configure auto-optimizer",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
