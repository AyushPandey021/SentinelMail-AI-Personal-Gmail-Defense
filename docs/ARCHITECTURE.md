# SentinelMail AI Architecture

## Services

- Frontend: React, Vite, TailwindCSS, React Router, Zustand, Axios, Recharts.
- API Gateway: Express Node.js JavaScript boundary for auth, RBAC, request validation, Gmail sync, dashboards, quarantine, policies, and threat feed.
- Auth Service: JWT access tokens, refresh-token rotation, bcrypt password verification, role checks.
- Email Ingestion Service: Gmail IMAP polling, email parsing, header extraction, and attachment metadata extraction.
- AI Analysis Service: FastAPI NLP and LLM analysis.
- Threat Intelligence Service: domain reputation, phishing patterns, malicious URL and attachment indicators.
- Risk Engine: deterministic risk scoring and action selection.
- Quarantine Service: hold, release, reject, and audit suspicious email.
- Notification Service: Slack, Teams, and email alerts.

## Scalability

The Gmail poller fetches new inbox messages, calls the AI service, persists normalized artifacts, computes risk, and fans out notifications. Duplicate messages are skipped by provider message id.

## Security Reasoning

All inbound inputs are validated with Zod/Pydantic. MongoDB writes use structured driver operations and indexed selectors rather than string-built queries. Refresh tokens are stored as hashes. Gmail credentials are loaded only from environment variables. Role boundaries are enforced at route level. Risk decisions and admin actions are written to immutable audit logs.
