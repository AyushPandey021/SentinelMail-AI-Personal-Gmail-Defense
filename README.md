# SentinelMail AI

Personal Gmail phishing detection and email security dashboard.

## Architecture

SentinelMail AI is a containerized monorepo with a React dashboard, a Node.js API, a Python FastAPI AI service, MongoDB, Redis, and Nginx.

Request path:

```text
React Frontend -> Nginx -> API Gateway -> Auth / Gmail Sync / Risk / Quarantine / Threat Intel / Notifications
Gmail IMAP Poller --------------------^                  -> AI Service -> MongoDB
```

The backend polls a configured Gmail inbox through IMAP, parses messages, calls the AI service, stores normalized email artifacts in MongoDB, calculates risk, and shows results in the dashboard, threat feed, quarantine, analytics, policies, and settings pages.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

API: `http://localhost:8080/api`
Frontend: `http://localhost:8080`
AI service: `http://localhost:8000/docs`

Demo admin from `db/mongo-init.js`:

- Email: `admin@demo.local`
- Password: `Password123!`

## Gmail Setup

Use a test Gmail account first.

1. Enable IMAP in Gmail settings.
2. Enable 2-Step Verification for the Google account.
3. Create a Google App Password.
4. Add these values to `.env`:

```env
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=yourtest@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
GMAIL_IMAP_HOST=imap.gmail.com
GMAIL_IMAP_PORT=993
GMAIL_IMAP_SECURE=true
GMAIL_POLL_INTERVAL_SECONDS=60
GMAIL_FULL_SYNC=true
```

After startup, the backend polls Gmail automatically. With `GMAIL_FULL_SYNC=true`, the first sync backfills the full Gmail inbox instead of only recent mail. You can also open Settings in the app and click `Sync now`.

## Local Development

```bash
npm install --prefix backend
npm install --prefix frontend
python -m venv ai-service/.venv
ai-service/.venv/Scripts/pip install -r ai-service/requirements.txt
```

Run services:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
uvicorn app.main:app --reload --app-dir ai-service
```

## Free Local Mode

You can run the app without Slack, Teams, or OpenAI credentials.

- Leave `OPENAI_API_KEY` empty to use the built-in heuristic phishing detector.
- Leave `SLACK_WEBHOOK_URL` and `TEAMS_WEBHOOK_URL` empty if you do not need alerts.
- Add Gmail credentials only when you want to analyze real inbox messages.
- Keep MongoDB and Redis running locally through Docker Compose.

What works locally:

- Login with the demo admin user.
- Gmail sync status and manual sync from Settings.
- Dashboard, threat feed, quarantine, analytics, policies, and email detail pages.
- MongoDB seed data from `db/mongo-init.js`.
- AI service email scoring through local heuristics.

## Email Risk Example

```json
{
  "sender": "founder@itradlent.com",
  "spoof_score": 93,
  "spf": "fail",
  "dkim": "fail",
  "dmarc": "fail",
  "phishing_probability": 96,
  "risk_level": "CRITICAL",
  "action": "QUARANTINE"
}
```
