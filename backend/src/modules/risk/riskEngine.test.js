import { describe, expect, it } from "vitest";
import { calculateRiskScore } from "./riskEngine.js";

describe("calculateRiskScore", () => {
  it("quarantines critical phishing examples", () => {
    const result = calculateRiskScore({
      domainSimilarityScore: 0.93,
      spf: "fail",
      dkim: "fail",
      dmarc: "fail",
      maliciousUrlCount: 2,
      attachmentRiskScore: 0.8,
      aiPhishingProbability: 0.96,
      senderAnomalyScore: 0.7,
      urgencyDetected: true,
      credentialTheftDetected: true
    });
    expect(result.level).toBe("CRITICAL");
    expect(result.action).toBe("QUARANTINE");
    expect(result.score).toBe(100);
  });
});
