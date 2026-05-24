import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export async function notifyThreat(threat) {
  const payload = {
    text: `SentinelMail ${threat.risk_level}: ${threat.subject} from ${threat.sender_email} (${threat.risk_score}/100)`
  };
  await Promise.allSettled([
    env.SLACK_WEBHOOK_URL ? axios.post(env.SLACK_WEBHOOK_URL, payload) : Promise.resolve(),
    env.TEAMS_WEBHOOK_URL ? axios.post(env.TEAMS_WEBHOOK_URL, payload) : Promise.resolve()
  ]).then((results) => {
    for (const result of results) if (result.status === "rejected") logger.warn({ err: result.reason }, "notification failed");
  });
}
