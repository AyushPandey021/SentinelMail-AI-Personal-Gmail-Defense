import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  const status = err.status || 500;
  if (status >= 500) logger.error({ err }, "Unhandled request error");
  return res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
}
