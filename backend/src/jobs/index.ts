import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";

export const EMAIL_QUEUE_NAME = "email-queue";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

export const createEmailWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      logger.info(`Processing job ${job.id} of type ${job.name}`, {
        data: job.data,
      });
      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    { connection: redisConnection },
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed with error: ${err.message}`);
  });

  return worker;
};
