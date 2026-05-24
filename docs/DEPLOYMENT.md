# Deployment

## Commands

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend through Nginx: `http://localhost:8080`
- API health: `http://localhost:8080/health`
- AI docs: `http://localhost:8000/docs`

## Production Notes

- Terminate HTTPS at a managed load balancer or Nginx with real certificates.
- Store secrets in GitHub Actions secrets, a cloud secret manager, or a comparable secure store.
- Use a dedicated Gmail test account or a tightly scoped mailbox for analysis.
- Rotate Gmail app passwords, JWT secrets, Slack/Teams webhooks, and database credentials.
- Run one Gmail poller per mailbox to avoid duplicate sync work.
- Configure MongoDB backups, point-in-time restore where available, and retention policies for audit logs.
