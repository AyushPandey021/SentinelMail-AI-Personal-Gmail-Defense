import { Router } from "express";
import { collections, oid } from "../db/mongo.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../modules/audit/audit.service.js";

export const quarantineRouter = Router();
quarantineRouter.use(requireAuth);

quarantineRouter.get("/", async (req, res, next) => {
  try {
    const { quarantinedEmails } = await collections();
    const rows = await quarantinedEmails.aggregate([
      { $match: { organizationId: oid(req.user.organizationId) } },
      { $lookup: { from: "emails", localField: "emailId", foreignField: "_id", as: "email" } },
      { $lookup: { from: "threat_scores", localField: "emailId", foreignField: "emailId", as: "score" } },
      { $unwind: "$email" },
      { $unwind: "$score" },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $project: {
          id: { $toString: "$_id" },
          status: 1,
          reason: 1,
          created_at: "$createdAt",
          sender_email: "$email.senderEmail",
          subject: "$email.subject",
          risk_score: "$score.riskScore",
          risk_level: "$score.riskLevel"
        }
      }
    ]).toArray();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

quarantineRouter.post("/:id/release", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { quarantinedEmails } = await collections();
    await quarantinedEmails.updateOne(
      { _id: oid(req.params.id), organizationId: oid(req.user.organizationId) },
      { $set: { status: "RELEASED", reviewedBy: oid(req.user.sub), reviewedAt: new Date() } }
    );
    await audit({ organizationId: req.user.organizationId, userId: req.user.sub, action: "QUARANTINE_RELEASE", entityType: "quarantine", entityId: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

quarantineRouter.post("/:id/reject", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { quarantinedEmails } = await collections();
    await quarantinedEmails.updateOne(
      { _id: oid(req.params.id), organizationId: oid(req.user.organizationId) },
      { $set: { status: "REJECTED", reviewedBy: oid(req.user.sub), reviewedAt: new Date() } }
    );
    await audit({ organizationId: req.user.organizationId, userId: req.user.sub, action: "QUARANTINE_REJECT", entityType: "quarantine", entityId: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
