import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";

export const redisConnection = env.DISABLE_REDIS_QUEUE ? null : new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const emailQueue = redisConnection
  ? new Queue("email-analysis", { connection: redisConnection })
  : {
      async add() {
        return null;
      }
    };
