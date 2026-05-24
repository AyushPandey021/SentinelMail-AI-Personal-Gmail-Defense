import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { collections, oid } from "../db/mongo.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/overview", async (req, res, next) => {
  try {
    const org = oid(req.user.organizationId);
    const { emails, threatScores, quarantinedEmails } = await collections();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [total, allTimeTotal, highRiskIds, quarantined, joined, categories] = await Promise.all([
      emails.countDocuments({ organizationId: org, receivedAt: { $gt: since30 } }),
      emails.countDocuments({ organizationId: org }),
      threatScores.find({ riskLevel: { $in: ["HIGH", "CRITICAL"] } }, { projection: { emailId: 1 } }).toArray(),
      quarantinedEmails.countDocuments({ organizationId: org, status: "HELD" }),
      emails.aggregate([
        { $match: { organizationId: org, receivedAt: { $gt: since14 } } },
        { $lookup: { from: "threat_scores", localField: "_id", foreignField: "emailId", as: "score" } },
        { $unwind: "$score" }
      ]).toArray(),
      emails.aggregate([
        { $match: { organizationId: org } },
        {
          $group: {
            _id: { id: { $ifNull: ["$category", "PERSONAL"] }, label: { $ifNull: ["$categoryLabel", "Personal / Other"] } },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);
    const highRiskEmailIds = new Set(highRiskIds.map((row) => row.emailId.toString()));
    const orgHighRisk = await emails.countDocuments({ organizationId: org, _id: { $in: [...highRiskEmailIds].map(oid) }, receivedAt: { $gt: since30 } });
    const byDay = new Map();
    const attackers = new Map();
    for (const row of joined) {
      const day = row.receivedAt.toISOString().slice(0, 10);
      const dayEntry = byDay.get(day) ?? { day, totalRisk: 0, count: 0 };
      dayEntry.totalRisk += row.score.riskScore;
      dayEntry.count += 1;
      byDay.set(day, dayEntry);
      if (["HIGH", "CRITICAL"].includes(row.score.riskLevel)) {
        const current = attackers.get(row.senderDomain) ?? { sender_domain: row.senderDomain, attempts: 0, max_score: 0 };
        current.attempts += 1;
        current.max_score = Math.max(current.max_score, row.score.riskScore);
        attackers.set(row.senderDomain, current);
      }
    }
    const trend = [...byDay.values()].map((item) => ({ day: item.day, avg_risk: +(item.totalRisk / item.count).toFixed(2), count: item.count })).sort((a, b) => a.day.localeCompare(b.day));
    const topAttackers = [...attackers.values()].sort((a, b) => b.attempts - a.attempts).slice(0, 10);
    const categorySummary = categories.map((item) => ({ category: item._id.id, label: item._id.label, count: item.count }));
    res.json({ summary: { total, all_time_total: allTimeTotal, high_risk: orgHighRisk, quarantined }, trend, topAttackers, categorySummary });
  } catch (err) {
    next(err);
  }
});
