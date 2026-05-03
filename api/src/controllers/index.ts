import { Router, type IRouter } from "express";
import healthRouter from "./health";
import engineRouter from "./engine";
import tradesRouter from "./trades";
import walletRouter from "./wallet";
import telemetryRouter from "./telemetry";
import settingsRouter from "./settings";
import autodetectRouter from "./autodetect";
import autoOptimizerRouter from "./auto-optimizer";
import copilotRouter from "./copilot";
import setupRouter from "./setup";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({
    message: "allbright Elite Engine Online",
    version: "1.0.0-production",
    mode: process.env.NODE_ENV || "development",
    system: "TypeScript/Node.js",
    health: "/api/health",
    docs: "/api/docs",
    auth: "API key required via Authorization: Bearer <token>",
  });
});

router.use(healthRouter);
router.use(engineRouter);
router.use(tradesRouter);
router.use(walletRouter);
router.use(telemetryRouter);
router.use("/settings", settingsRouter);
router.use("/autodetect", autodetectRouter);
router.use("/auto-optimizer", autoOptimizerRouter);
router.use("/copilot", copilotRouter);
router.use("/setup", setupRouter);

export default router;
