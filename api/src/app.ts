import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { createServer } from "http";
import { Server } from "socket.io";
import { getMetrics } from "./routes/metrics";
import { rateLimiter } from "./middleware/rateLimiter";

const app: Express = express();
const httpServer = createServer(app);

// BSS-06: Initialize Socket.io and attach to global scope.
// This allows high-speed telemetry in engine routes to broadcast without dependency loops.
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phase4C.2: Rate limiting for sensitive endpoints
app.use(rateLimiter);

app.use("/api", router);

// Prometheus /metrics endpoint (Phase4D.3)
app.get("/metrics", getMetrics);

app.get("/", (req, res) => {
  res.redirect("/api/health");
});

export { app, httpServer };
export default httpServer;
