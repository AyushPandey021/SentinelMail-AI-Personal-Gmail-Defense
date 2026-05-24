import { logger } from "../../config/logger.js";
import { collections } from "../../db/mongo.js";
import { analyzeEmail } from "../ai/aiClient.js";
import { notifyThreat } from "../notifications/notification.service.js";
import { calculateRiskScore } from "../risk/riskEngine.js";
import { classifyEmailCategory } from "./emailCategory.js";
import { domainSimilarity, extractAuthResults, extractUrls, hasHomoglyphs } from "./emailExtractor.js";

export async function analyzeAndStoreEmail({ mailbox, message, attachments = [] }) {
  const {
    domains,
    emails,
    emailHeaders,
    attachments: attachmentCollection,
    aiAnalysisResults,
    threatScores,
    quarantinedEmails
  } = await collections();

  const existing = await emails.findOne({
    mailboxId: mailbox._id,
    providerMessageId: message.providerMessageId
  });
  if (existing) {
    if (!existing.category) {
      const existingScore = await threatScores.findOne({ emailId: existing._id });
      const category = classifyEmailCategory({
        senderEmail: existing.senderEmail,
        senderDomain: existing.senderDomain,
        subject: existing.subject,
        bodyText: existing.bodyText,
        headers: [],
        risk: { level: existingScore?.riskLevel ?? "LOW" }
      });
      await emails.updateOne(
        { _id: existing._id },
        { $set: { category: category.id, categoryLabel: category.label, "rawMetadata.category": category.id, "rawMetadata.categoryLabel": category.label } }
      );
    }
    return { emailId: existing._id, skipped: true };
  }

  const senderEmail = message.senderEmail ?? "";
  const senderDomain = senderEmail.split("@")[1]?.toLowerCase() ?? "";
  const bodyText = message.bodyText ?? "";
  const urls = extractUrls(bodyText);
  const auth = extractAuthResults(message.headers ?? []);
  const domainRows = await domains.find({ organizationId: mailbox.organizationId, isTrusted: true }).toArray();
  const trustedDomains = domainRows.map((row) => row.domain);

  const ai = await analyzeEmail({
    sender: senderEmail,
    reply_to: message.replyTo,
    subject: message.subject,
    headers: message.headers ?? [],
    body: bodyText,
    urls,
    attachments
  });

  const risk = calculateRiskScore({
    domainSimilarityScore: domainSimilarity(senderDomain, trustedDomains),
    spf: auth.spf,
    dkim: auth.dkim,
    dmarc: auth.dmarc,
    maliciousUrlCount: ai.malicious_url_count,
    attachmentRiskScore: ai.attachment_risk_score,
    aiPhishingProbability: ai.phishing_probability,
    senderAnomalyScore: ai.sender_anomaly_score,
    urgencyDetected: ai.urgency_detected,
    credentialTheftDetected: ai.credential_theft_detected
  });
  const category = classifyEmailCategory({
    senderEmail,
    senderDomain,
    subject: message.subject,
    bodyText,
    headers: message.headers ?? [],
    risk
  });

  const emailInsert = await emails.insertOne({
    organizationId: mailbox.organizationId,
    mailboxId: mailbox._id,
    providerMessageId: message.providerMessageId,
    internetMessageId: message.internetMessageId,
    senderEmail,
    senderDomain,
    replyTo: message.replyTo ?? null,
    subject: message.subject ?? "",
    bodyText: bodyText.slice(0, 20000),
    urls,
    category: category.id,
    categoryLabel: category.label,
    receivedAt: message.receivedAt ?? new Date(),
    rawMetadata: {
      provider: message.provider ?? "gmail",
      uid: message.uid,
      category: category.id,
      categoryLabel: category.label,
      hasHomoglyphs: hasHomoglyphs(senderEmail)
    },
    createdAt: new Date()
  });
  const emailId = emailInsert.insertedId;

  const headerDocs = (message.headers ?? []).map((header) => ({
    emailId,
    name: header.name,
    nameLower: header.name?.toLowerCase(),
    value: header.value
  }));
  if (headerDocs.length) await emailHeaders.insertMany(headerDocs);

  const attachmentDocs = attachments.map((attachment) => ({
    emailId,
    name: attachment.name,
    contentType: attachment.contentType,
    sizeBytes: attachment.size,
    sha256: null,
    riskFlags: [],
    createdAt: new Date()
  }));
  if (attachmentDocs.length) await attachmentCollection.insertMany(attachmentDocs);

  await aiAnalysisResults.insertOne({
    emailId,
    model: ai.model,
    phishingProbability: ai.phishing_probability,
    summary: ai.summary,
    suspiciousIntent: ai.suspicious_intent,
    toneManipulation: ai.tone_manipulation,
    rawResponse: ai,
    createdAt: new Date()
  });
  await threatScores.insertOne({
    emailId,
    riskScore: risk.score,
    riskLevel: risk.level,
    action: risk.action,
    factors: { ...auth, ...ai },
    createdAt: new Date()
  });

  if (risk.action === "QUARANTINE") {
    await quarantinedEmails.insertOne({
      organizationId: mailbox.organizationId,
      emailId,
      status: "HELD",
      reason: "Automated risk score threshold",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date()
    });
  }
  if (risk.level === "HIGH" || risk.level === "CRITICAL") {
    await notifyThreat({ ...risk, risk_level: risk.level, risk_score: risk.score, subject: message.subject, sender_email: senderEmail });
  }

  logger.info({ emailId, category: category.id, risk: risk.level, score: risk.score }, "email analyzed");
  return { emailId, skipped: false, category, risk };
}
