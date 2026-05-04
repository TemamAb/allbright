import express, { Router, type IRouter } from "express";
import path from "path";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: IRouter = Router();

// BSS-ARCH: Unified Path Resolution
// In production (Docker), we serve from /app/ui/dist. 
// In development, we traverse up from /api/src/controllers to the workspace root.
const uiDistPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(process.cwd(), "ui/dist") 
  : path.resolve(__dirname, "../../../ui/dist");

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

// 1. Multi-Mount Static Serving
// This ensures assets are found whether the HTML asks for /assets/... or /ui/dist/assets/...
router.use(express.static(uiDistPath, { maxAge: '1d' }));
router.use('/ui/dist', express.static(uiDistPath, { maxAge: '1d' }));

// 2. Hardened SPA Fallback
router.get("*", (req, res, next) => {
  // CRITICAL: Do not serve index.html for API calls or missing assets (anything with a dot).
  // If a .js or .css file isn't found in express.static, it MUST 404, not fallback to HTML.
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  
  res.sendFile(path.resolve(uiDistPath, "index.html"));
});

export default router;
