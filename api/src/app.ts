import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./controllers";
import { logger } from "./services/logger";
import { createServer } from "http";
import { Server } from "socket.io";
import { getMetrics } from "./controllers/metrics";
import { rateLimiter } from "./middleware/rateLimiter";
import { authenticate } from "./middleware/auth";

const app: Express = express();
const httpServer = createServer(app);

// CORS Configuration: Restrict to known origins
// Development: http://localhost:3000 (Vite dev server)
// Production: https://allbright-ui.vercel.app (or your deployed domain)
const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? [
  "http://localhost:3000",
  "http://localhost:5173", // Vite default
  process.env.UI_URL || "https://allbright-ui.vercel.app"
];

// BSS-06: Initialize Socket.io with restricted CORS
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

(global as any).io = io;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          clientId: (req as any).clientId, // from auth middleware
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Apply CORS globally (will match origin against corsOrigins)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin, path: undefined as any }, "CORS blocked request from unauthorized origin");
      callback(new Error("Origin not allowed by CORS policy"), false);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phase4C.2: Rate limiting for all endpoints (protect against abuse)
app.use(rateLimiter);

// Public routes (no auth required)
app.get("/", (_req, res) => {
  res.json({
    message: "allbright Elite Engine Online",
    version: "1.0.0-production",
    mode: process.env.NODE_ENV || "development",
    system: "TypeScript/Node.js",
    health: "/api/health",
    docs: "/api/docs",
  });
});

// Health check (public, for monitoring)
app.use("/api/health", require("./controllers/health").default);

// Metrics endpoint (Prometheus) - allow without auth for scraping
app.get("/metrics", getMetrics);

// API routes requiring authentication
const apiRouter = express.Router();
apiRouter.use(authenticate); // Apply auth to all /api/* routes except explicitly public
apiRouter.use("/", router);
app.use("/api", apiRouter);

export { app, httpServer };
export default httpServer;
