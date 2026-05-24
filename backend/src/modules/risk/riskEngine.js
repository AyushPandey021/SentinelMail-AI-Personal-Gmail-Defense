export function calculateRiskScore(input) {
  const weights = {
    domainSimilarity: 18,
    spfFail: 10,
    dkimFail: 10,
    dmarcFail: 14,
    maliciousLinks: 16,
    attachmentRisk: 12,
    aiPhishing: 25,
    senderAnomaly: 12,
    urgency: 8,
    credentialTheft: 12
  };
  let score = 0;
  score += Math.min(1, input.domainSimilarityScore ?? 0) * weights.domainSimilarity;
  score += input.spf === "fail" ? weights.spfFail : 0;
  score += input.dkim === "fail" ? weights.dkimFail : 0;
  score += input.dmarc === "fail" ? weights.dmarcFail : 0;
  score += Math.min(1, (input.maliciousUrlCount ?? 0) / 2) * weights.maliciousLinks;
  score += Math.min(1, input.attachmentRiskScore ?? 0) * weights.attachmentRisk;
  score += Math.min(1, input.aiPhishingProbability ?? 0) * weights.aiPhishing;
  score += Math.min(1, input.senderAnomalyScore ?? 0) * weights.senderAnomaly;
  score += input.urgencyDetected ? weights.urgency : 0;
  score += input.credentialTheftDetected ? weights.credentialTheft : 0;
  const normalized = Math.min(100, Math.round(score));
  return { score: normalized, level: riskLevel(normalized), action: actionForScore(normalized) };
}

export function riskLevel(score) {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function actionForScore(score) {
  if (score >= 85) return "QUARANTINE";
  if (score >= 65) return "WARN";
  if (score >= 35) return "WARN";
  return "ALLOW";
}
