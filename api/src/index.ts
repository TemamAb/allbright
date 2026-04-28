import httpServer from "./app";
import { logger } from "./services/logger";

const rawPort = process.env["PORT"] || "10000";
const port = Number(rawPort) || 10000;

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
}).on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
