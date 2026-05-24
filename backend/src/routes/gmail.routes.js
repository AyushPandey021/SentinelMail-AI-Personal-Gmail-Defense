import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getGmailStatus, syncGmailInbox } from "../modules/gmail/gmailClient.js";

export const gmailRouter = Router();
gmailRouter.use(requireAuth);

gmailRouter.get("/status", (_req, res) => {
  res.json(getGmailStatus());
});

gmailRouter.post("/sync", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const result = await syncGmailInbox();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
