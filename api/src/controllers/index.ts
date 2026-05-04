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

// In production (Docker), __dirname is /app/api/dist
// ui/dist is copied to /app/ui/dist
const uiDistPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), "ui/dist")
  : path.join(__dirname, "../../ui/dist");

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

// Serve static assets from the UI build
router.use(express.static(uiDistPath));

// Catch-all route for SPA - exclude /api routes and static files, allowing other middleware to handle
router.get("*", (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(uiDistPath, "index.html"));
});

export default router;
