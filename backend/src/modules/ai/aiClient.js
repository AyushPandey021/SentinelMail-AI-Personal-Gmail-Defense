import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const URGENCY_TERMS = ["urgent", "immediately", "final notice", "suspended", "expires today", "wire transfer"];
const CREDENTIAL_TERMS = ["password", "mfa", "verify account", "login", "credential", "reset your account"];
const SUSPICIOUS_TLDS = new Set(["zip", "mov", "tk", "top", "xyz", "click", "gq"]);
const DANGEROUS_EXTENSIONS = [".exe", ".scr", ".js", ".vbs", ".iso", ".lnk", ".hta", ".ps1", ".bat", ".cmd"];

function containsAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function maliciousUrlCount(urls = []) {
  let count = 0;
  for (const value of urls) {
    try {
      const url = new URL(value);
      const host = url.hostname;
      const tld = host.split(".").pop();
      if (value.includes("@") || /\d+\.\d+\.\d+\.\d+/.test(host) || SUSPICIOUS_TLDS.has(tld)) count += 1;
      if (host.split(".").length > 4) count += 1;
    } catch {
      count += 1;
    }
  }
  return count;
}

function attachmentRisk(attachments = []) {
  if (attachments.length === 0) return 0;
  const risky = attachments.reduce((total, attachment) => {
    const name = attachment.name?.toLowerCase() ?? "";
    const hasDangerousExtension = DANGEROUS_EXTENSIONS.some((ext) => name.endsWith(ext));
    return total + (hasDangerousExtension ? 1 : 0) + (attachment.size > 20_000_000 ? 0.5 : 0);
  }, 0);
  return Math.min(1, risky / attachments.length);
}

function heuristicAnalyze(email) {
  const text = `From: ${email.sender}\nReply-To: ${email.reply_to ?? ""}\nSubject: ${email.subject ?? ""}\n\n${email.body ?? ""}`;
  const urlCount = maliciousUrlCount(email.urls);
  const attachScore = attachmentRisk(email.attachments);
  const urgency = containsAny(text, URGENCY_TERMS);
  const credentialTheft = containsAny(text, CREDENTIAL_TERMS);
  let probability = 0.05;
  probability += urgency ? 0.25 : 0;
  probability += credentialTheft ? 0.3 : 0;
  probability += Math.min(0.25, urlCount * 0.12);
  probability += attachScore * 0.2;
  probability += /gift card|crypto|invoice|payment/i.test(text) ? 0.1 : 0;

  return {
    model: "backend-heuristic-fallback",
    phishing_probability: Math.min(0.99, probability),
    malicious_url_count: urlCount,
    attachment_risk_score: attachScore,
    sender_anomaly_score: email.reply_to && !email.reply_to.endsWith(email.sender?.split("@").pop() ?? "") ? 0.35 : 0.05,
    urgency_detected: urgency,
    credential_theft_detected: credentialTheft,
    suspicious_intent: credentialTheft ? "Credential theft indicators" : "Heuristic phishing indicators",
    tone_manipulation: urgency ? "Urgency pressure" : "None detected",
    summary: "Message scored by backend fallback heuristics because the AI service was unavailable."
  };
}

export async function analyzeEmail(email) {
  try {
    const { data } = await axios.post(`${env.AI_SERVICE_URL}/analyze-email`, email, { timeout: 15000 });
    return data;
  } catch (err) {
    logger.warn({ err: err.message }, "AI service unavailable; using backend heuristic email analysis");
    return heuristicAnalyze(email);
  }
}

export async function analyzeAttachments(attachments) {
  const { data } = await axios.post(`${env.AI_SERVICE_URL}/analyze-attachments`, { attachments }, { timeout: 15000 });
  return data;
}
