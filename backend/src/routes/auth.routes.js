import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { login, logout, refresh } from "../modules/auth/auth.service.js";

export const authRouter = Router();

const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) });

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body.email, req.body.password);
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const result = await refresh(req.cookies.refreshToken);
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
