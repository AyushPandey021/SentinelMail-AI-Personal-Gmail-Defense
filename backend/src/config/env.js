import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("sentinelmail"),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  DISABLE_REDIS_QUEUE: z.coerce.boolean().default(false),
  EMAIL_PROVIDER: z.enum(["gmail"]).default("gmail"),
  GMAIL_EMAIL: z.string().email().optional().or(z.literal("")),
  GMAIL_APP_PASSWORD: z.string().optional().or(z.literal("")),
  GMAIL_IMAP_HOST: z.string().default("imap.gmail.com"),
  GMAIL_IMAP_PORT: z.coerce.number().default(993),
  GMAIL_IMAP_SECURE: z.coerce.boolean().default(true),
  GMAIL_POLL_INTERVAL_SECONDS: z.coerce.number().int().min(30).default(60),
  GMAIL_FULL_SYNC: z.coerce.boolean().default(true),
  AI_SERVICE_URL: z.string().url(),
  SLACK_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  TEAMS_WEBHOOK_URL: z.string().url().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);
