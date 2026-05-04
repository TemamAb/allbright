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

// BSS-ARCH: Ensure uiDistPath correctly points to /app/ui/dist in production Docker.
// In Docker, process.cwd() is /app, and ui/dist is copied to /app/ui/dist.
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

// 1. Serve static assets with a definitive maxAge to prevent flickering
router.use(express.static(uiDistPath, { maxAge: '1d' }));

// 2. Smart SPA Fallback: Only serve index.html for navigation requests.
// This prevents the "White Page" caused by serving HTML for missing JS/CSS files.
router.get("*", (req, res, next) => {
  // Skip if it's an API call or looks like a file request (has an extension)
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  // Only send index.html if the browser explicitly wants HTML
  res.sendFile(path.join(uiDistPath, "index.html"));
});

export default router;
