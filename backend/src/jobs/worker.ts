import { createEmailWorker } from "./index.js";
import { logger } from "../lib/logger.js";

logger.info("Starting background workers...");

const emailWorker = createEmailWorker();

process.on("SIGTERM", async () => {
  await emailWorker.close();
});
