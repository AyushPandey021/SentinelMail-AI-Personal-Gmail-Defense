import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { collections } from "../../db/mongo.js";
import { analyzeAndStoreEmail } from "../email/emailAnalysis.service.js";

let syncRunning = false;
let lastSync = null;
let lastError = null;
let lastResult = null;

function gmailConfigured() {
  return Boolean(env.GMAIL_EMAIL && env.GMAIL_APP_PASSWORD);
}

function createClient() {
  return new ImapFlow({
    host: env.GMAIL_IMAP_HOST,
    port: env.GMAIL_IMAP_PORT,
    secure: env.GMAIL_IMAP_SECURE,
    auth: {
      user: env.GMAIL_EMAIL,
      pass: env.GMAIL_APP_PASSWORD
    },
    logger: false
  });
}

function headerList(headers) {
  return [...headers.entries()].flatMap(([name, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values.map((item) => ({ name, value: String(item) }));
  });
}

function firstAddress(addresses) {
  return addresses?.value?.[0]?.address ?? "";
}

function textFromParsed(parsed) {
  if (parsed.text) return parsed.text;
  return (parsed.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function ensureGmailMailbox() {
  const { organizations, mailboxes, domains } = await collections();
  let org = await organizations.findOne({ tenantId: "demo-tenant" });
  if (!org) {
    const result = await organizations.insertOne({ name: "Personal Gmail", tenantId: "demo-tenant", createdAt: new Date() });
    org = { _id: result.insertedId };
  }

  const emailLower = env.GMAIL_EMAIL.toLowerCase();
  await mailboxes.updateOne(
    { organizationId: org._id, emailLower },
    {
      $setOnInsert: {
        organizationId: org._id,
        email: env.GMAIL_EMAIL,
        emailLower,
        displayName: "Personal Gmail Inbox",
        providerSubscriptionId: null,
        subscriptionExpiresAt: null,
        lastSyncedAt: null,
        lastGmailUid: null,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  const domain = emailLower.split("@")[1];
  if (domain) {
    await domains.updateOne(
      { organizationId: org._id, domainLower: domain },
      { $setOnInsert: { organizationId: org._id, domain, domainLower: domain, isTrusted: true, reputationScore: 95, createdAt: new Date() } },
      { upsert: true }
    );
  }

  return mailboxes.findOne({ organizationId: org._id, emailLower });
}

async function processMessage(mailbox, message) {
  const parsed = await simpleParser(message.source);
  const attachments = (parsed.attachments ?? []).map((attachment) => ({
    name: attachment.filename ?? "attachment",
    contentType: attachment.contentType,
    size: attachment.size
  }));

  return analyzeAndStoreEmail({
    mailbox,
    message: {
      provider: "gmail",
      providerMessageId: `gmail:${message.uid}`,
      uid: message.uid,
      internetMessageId: parsed.messageId,
      senderEmail: firstAddress(parsed.from),
      replyTo: firstAddress(parsed.replyTo),
      subject: parsed.subject ?? "",
      bodyText: textFromParsed(parsed),
      headers: headerList(parsed.headers),
      receivedAt: parsed.date ?? message.internalDate ?? new Date()
    },
    attachments
  });
}

async function existingEmail(mailbox, uid) {
  const { emails } = await collections();
  return emails.findOne(
    { mailboxId: mailbox._id, providerMessageId: `gmail:${uid}` },
    { projection: { _id: 1, category: 1 } }
  );
}

export function getGmailStatus() {
  return {
    configured: gmailConfigured(),
    email: env.GMAIL_EMAIL || null,
    last_sync: lastSync,
    last_error: lastError,
    last_result: lastResult,
    sync_running: syncRunning,
    poll_interval_seconds: env.GMAIL_POLL_INTERVAL_SECONDS
  };
}

export async function syncGmailInbox() {
  if (!gmailConfigured()) {
    lastError = "Gmail is not configured. Add GMAIL_EMAIL and GMAIL_APP_PASSWORD.";
    return { configured: false, analyzed: 0, skipped: 0 };
  }
  if (syncRunning) return { configured: true, running: true, analyzed: 0, skipped: 0 };

  syncRunning = true;
  const client = createClient();
  let analyzed = 0;
  let skipped = 0;
  let maxUid = 0;

  try {
    const mailbox = await ensureGmailMailbox();
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const inbox = await client.mailboxOpen("INBOX");
      if (inbox.exists === 0) {
        lastResult = { analyzed: 0, skipped: 0, inbox_count: 0 };
        lastSync = new Date();
        lastError = null;
        logger.info(lastResult, "gmail sync finished; inbox is empty");
        return { configured: true, ...lastResult };
      }
      const lastUid = mailbox.lastGmailUid;
      const fullBackfill = env.GMAIL_FULL_SYNC && !mailbox.fullGmailSyncCompleted;
      const range = fullBackfill || !lastUid ? "1:*" : `${lastUid + 1}:*`;
      logger.info({ email: env.GMAIL_EMAIL, range, inboxCount: inbox.exists, fullBackfill }, "gmail sync started");
      for await (const message of client.fetch(range, { uid: true, internalDate: true }, { uid: true })) {
        maxUid = Math.max(maxUid, message.uid ?? 0);
        const existing = await existingEmail(mailbox, message.uid);
        if (existing?.category) {
          skipped += 1;
          continue;
        }

        const messageWithSource = await client.fetchOne(message.uid, { uid: true, source: true, internalDate: true }, { uid: true });
        const result = await processMessage(mailbox, messageWithSource);
        if (result.skipped) skipped += 1;
        else analyzed += 1;
      }
    } finally {
      lock.release();
    }

    if (maxUid) {
      const { mailboxes } = await collections();
      await mailboxes.updateOne(
        { _id: mailbox._id },
        { $set: { lastGmailUid: maxUid, lastSyncedAt: new Date(), fullGmailSyncCompleted: true } }
      );
    }
    lastSync = new Date();
    lastError = null;
    lastResult = { analyzed, skipped, inbox_count: analyzed + skipped };
    logger.info(lastResult, "gmail sync finished");
    return { configured: true, ...lastResult };
  } catch (err) {
    lastError = err.message;
    logger.error({ err }, "gmail sync failed");
    throw err;
  } finally {
    await client.logout().catch(() => { });
    syncRunning = false;
  }
}

export function startGmailPoller() {
  if (!gmailConfigured()) {
    logger.warn("Gmail analyzer is disabled until GMAIL_EMAIL and GMAIL_APP_PASSWORD are set.");
    return;
  }

  logger.info({ email: env.GMAIL_EMAIL, pollIntervalSeconds: env.GMAIL_POLL_INTERVAL_SECONDS }, "Gmail analyzer enabled");
  syncGmailInbox().catch(() => { });
  setInterval(() => {
    syncGmailInbox().catch(() => { });
  }, env.GMAIL_POLL_INTERVAL_SECONDS * 1000);
}
