const database = db.getSiblingDB("sentinelmail");

for (const name of [
  "organizations",
  "users",
  "refresh_tokens",
  "mailboxes",
  "domains",
  "emails",
  "email_headers",
  "attachments",
  "ai_analysis_results",
  "threat_scores",
  "quarantined_emails",
  "phishing_patterns",
  "audit_logs"
]) {
  if (!database.getCollectionNames().includes(name)) database.createCollection(name);
}

database.organizations.createIndex({ tenantId: 1 }, { unique: true });
database.users.createIndex({ emailLower: 1 }, { unique: true });
database.users.createIndex({ organizationId: 1, role: 1 });
database.refresh_tokens.createIndex({ tokenHash: 1 }, { unique: true });
database.refresh_tokens.createIndex({ userId: 1, revokedAt: 1 });
database.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
database.mailboxes.createIndex({ organizationId: 1, emailLower: 1 }, { unique: true });
database.domains.createIndex({ organizationId: 1, domainLower: 1 }, { unique: true });
database.domains.createIndex({ organizationId: 1, isTrusted: 1 });
database.emails.createIndex({ mailboxId: 1, providerMessageId: 1 }, { unique: true });
database.emails.createIndex({ organizationId: 1, receivedAt: -1 });
database.emails.createIndex({ organizationId: 1, senderDomain: 1 });
database.email_headers.createIndex({ emailId: 1, nameLower: 1 });
database.attachments.createIndex({ emailId: 1 });
database.ai_analysis_results.createIndex({ emailId: 1 }, { unique: true });
database.threat_scores.createIndex({ emailId: 1 }, { unique: true });
database.threat_scores.createIndex({ riskLevel: 1, riskScore: -1 });
database.quarantined_emails.createIndex({ emailId: 1 }, { unique: true });
database.quarantined_emails.createIndex({ organizationId: 1, status: 1, createdAt: -1 });
database.audit_logs.createIndex({ organizationId: 1, createdAt: -1 });

const now = new Date();
let org = database.organizations.findOne({ tenantId: "demo-tenant" });
if (!org) {
  const result = database.organizations.insertOne({ name: "Demo Organization", tenantId: "demo-tenant", createdAt: now });
  org = { _id: result.insertedId };
}

database.users.updateOne(
  { emailLower: "admin@demo.local" },
  {
    $setOnInsert: {
      organizationId: org._id,
      email: "admin@demo.local",
      emailLower: "admin@demo.local",
      name: "Security Admin",
      password_hash: "$2a$10$hTYz4sghpZOHj8KV61x8de8Cq3wmHN7dgzivzHNuxxV.6O2Nml68W",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now
    }
  },
  { upsert: true }
);

database.mailboxes.updateOne(
  { organizationId: org._id, emailLower: "security@demo.local" },
  {
    $setOnInsert: {
      organizationId: org._id,
      email: "security@demo.local",
      emailLower: "security@demo.local",
      displayName: "Security Inbox",
        providerSubscriptionId: null,
      subscriptionExpiresAt: null,
      lastSyncedAt: null,
      createdAt: now
    }
  },
  { upsert: true }
);

database.domains.updateOne(
  { organizationId: org._id, domainLower: "demo.local" },
  {
    $setOnInsert: {
      organizationId: org._id,
      domain: "demo.local",
      domainLower: "demo.local",
      isTrusted: true,
      reputationScore: 95,
      createdAt: now
    }
  },
  { upsert: true }
);

for (const pattern of [
  { pattern: "verify your password", category: "credential_theft", weight: 12 },
  { pattern: "urgent wire transfer", category: "business_email_compromise", weight: 15 },
  { pattern: "account will be suspended", category: "urgency", weight: 10 }
]) {
  database.phishing_patterns.updateOne(
    { pattern: pattern.pattern, organizationId: null },
    { $setOnInsert: { ...pattern, organizationId: null, isActive: true, createdAt: now } },
    { upsert: true }
  );
}
