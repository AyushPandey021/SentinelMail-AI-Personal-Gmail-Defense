import { Router } from "express";
import { z } from "zod";
import { collections, oid } from "../db/mongo.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const threatRouter = Router();
threatRouter.use(requireAuth);

const listSchema = z.object({
  query: z.object({
    level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    category: z.enum(["ADS", "NO_REPLY", "SOCIAL", "FINANCE", "SECURITY", "DEVELOPER", "SUSPICIOUS", "PERSONAL"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

threatRouter.get("/", validate(listSchema), async (req, res, next) => {
  try {
    const offset = (req.query.page - 1) * req.query.limit;
    const { emails } = await collections();
    const pipeline = [
      { $match: { organizationId: oid(req.user.organizationId) } },
      { $lookup: { from: "threat_scores", localField: "_id", foreignField: "emailId", as: "score" } },
      { $unwind: "$score" },
      ...(req.query.level ? [{ $match: { "score.riskLevel": req.query.level } }] : []),
      ...(req.query.category ? [{ $match: { category: req.query.category } }] : []),
      { $lookup: { from: "quarantined_emails", localField: "_id", foreignField: "emailId", as: "quarantine" } },
      { $sort: { receivedAt: -1 } },
      { $skip: offset },
      { $limit: req.query.limit },
      {
        $project: {
          id: { $toString: "$_id" },
          sender_email: "$senderEmail",
          sender_domain: "$senderDomain",
          category: { $ifNull: ["$category", "PERSONAL"] },
          category_label: { $ifNull: ["$categoryLabel", "Personal / Other"] },
          subject: 1,
          received_at: "$receivedAt",
          risk_score: "$score.riskScore",
          risk_level: "$score.riskLevel",
          action: "$score.action",
          quarantine_status: { $arrayElemAt: ["$quarantine.status", 0] }
        }
      }
    ];
    const rows = await emails.aggregate(pipeline).toArray();
    res.json({ data: rows, page: req.query.page, limit: req.query.limit });
  } catch (err) {
    next(err);
  }
});

threatRouter.get("/:id", async (req, res, next) => {
  try {
    const { emails } = await collections();
    const rows = await emails.aggregate([
      { $match: { _id: oid(req.params.id), organizationId: oid(req.user.organizationId) } },
      { $lookup: { from: "threat_scores", localField: "_id", foreignField: "emailId", as: "score" } },
      { $lookup: { from: "ai_analysis_results", localField: "_id", foreignField: "emailId", as: "ai" } },
      { $unwind: { path: "$score", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$ai", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: "$_id" },
          sender_email: "$senderEmail",
          sender_domain: "$senderDomain",
          reply_to: "$replyTo",
          category: { $ifNull: ["$category", "PERSONAL"] },
          category_label: { $ifNull: ["$categoryLabel", "Personal / Other"] },
          subject: 1,
          body_text: "$bodyText",
          urls: 1,
          received_at: "$receivedAt",
          risk_score: "$score.riskScore",
          risk_level: "$score.riskLevel",
          action: "$score.action",
          factors: "$score.factors",
          summary: "$ai.summary",
          suspicious_intent: "$ai.suspiciousIntent",
          tone_manipulation: "$ai.toneManipulation"
        }
      }
    ]).toArray();
    res.json(rows[0] ?? null);
  } catch (err) {
    next(err);
  }
});
