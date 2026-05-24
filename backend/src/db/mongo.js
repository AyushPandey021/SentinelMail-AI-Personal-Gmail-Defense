import { MongoClient, ObjectId } from "mongodb";
import { env } from "../config/env.js";

const client = new MongoClient(env.MONGODB_URI, {
  maxPoolSize: 30,
  minPoolSize: 2
});

let database;

export async function connectMongo() {
  if (!database) {
    await client.connect();
    database = client.db(env.MONGODB_DB);
    await ensureIndexes(database);
  }
  return database;
}

export function oid(value) {
  return value instanceof ObjectId ? value : new ObjectId(value);
}

export async function collections() {
  const db = await connectMongo();
  return {
    organizations: db.collection("organizations"),
    users: db.collection("users"),
    refreshTokens: db.collection("refresh_tokens"),
    mailboxes: db.collection("mailboxes"),
    domains: db.collection("domains"),
    emails: db.collection("emails"),
    emailHeaders: db.collection("email_headers"),
    attachments: db.collection("attachments"),
    aiAnalysisResults: db.collection("ai_analysis_results"),
    threatScores: db.collection("threat_scores"),
    quarantinedEmails: db.collection("quarantined_emails"),
    phishingPatterns: db.collection("phishing_patterns"),
    auditLogs: db.collection("audit_logs")
  };
}

async function ensureIndexes(db) {
  const emailIndexes = await db.collection("emails").indexes();
  if (emailIndexes.some((index) => index.name === "mailboxId_1_graphMessageId_1")) {
    await db.collection("emails").dropIndex("mailboxId_1_graphMessageId_1");
  }

  await Promise.all([
    db.collection("organizations").createIndex({ tenantId: 1 }, { unique: true }),
    db.collection("users").createIndex({ emailLower: 1 }, { unique: true }),
    db.collection("users").createIndex({ organizationId: 1, role: 1 }),
    db.collection("refresh_tokens").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("refresh_tokens").createIndex({ userId: 1, revokedAt: 1 }),
    db.collection("refresh_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("mailboxes").createIndex({ organizationId: 1, emailLower: 1 }, { unique: true }),
    db.collection("domains").createIndex({ organizationId: 1, domainLower: 1 }, { unique: true }),
    db.collection("domains").createIndex({ organizationId: 1, isTrusted: 1 }),
    db.collection("emails").createIndex({ mailboxId: 1, providerMessageId: 1 }, { unique: true }),
    db.collection("emails").createIndex({ organizationId: 1, receivedAt: -1 }),
    db.collection("emails").createIndex({ organizationId: 1, senderDomain: 1 }),
    db.collection("email_headers").createIndex({ emailId: 1, nameLower: 1 }),
    db.collection("attachments").createIndex({ emailId: 1 }),
    db.collection("ai_analysis_results").createIndex({ emailId: 1 }, { unique: true }),
    db.collection("threat_scores").createIndex({ emailId: 1 }, { unique: true }),
    db.collection("threat_scores").createIndex({ riskLevel: 1, riskScore: -1 }),
    db.collection("quarantined_emails").createIndex({ emailId: 1 }, { unique: true }),
    db.collection("quarantined_emails").createIndex({ organizationId: 1, status: 1, createdAt: -1 }),
    db.collection("audit_logs").createIndex({ organizationId: 1, createdAt: -1 })
  ]);
}
