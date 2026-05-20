import httpServer from "./app";
import { logger } from "./services/logger";

console.log("[START] API starting, process.env.PORT:", process.env.PORT);

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort) || 3000;

console.log("[START] Attempting to bind to port:", port);

httpServer.listen(port, '0.0.0.0', () => {
  logger.info({ port }, "Server listening");
}).on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
