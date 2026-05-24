import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Missing bearer token"));
  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient role"));
    return next();
  };
}
