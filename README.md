# SecureCatch

A security operations dashboard for triaging and remediating user-reported phishing alerts. SecureCatch ingests open Jira SECOPS tickets, enriches them with VirusTotal OSINT and AI-assisted classification, and provides one-click remediation via Gmail domain-wide purge and Jira ticket closure.

## Features

- **Alert ingestion** — pulls open phishing tickets from Jira filtered by CSIRT reporter
- **OSINT enrichment** — scans URLs and indicators via VirusTotal
- **AI classification** — uses OpenRouter (Claude, GPT-4o, Gemini) to reason over email content
- **Remediation workflows** — domain-wide Gmail purge or false-positive closure, synced back to Jira
- **Google Workspace integration** — reads email headers/body/links via Gmail API and Alert Center

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router, TypeScript)
- [Prisma](https://prisma.io) + SQLite (dev) / PostgreSQL (prod)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Jira REST API, Google Workspace APIs, VirusTotal API, OpenRouter API

## Getting Started

See [SETUP.md](./SETUP.md) for full setup instructions including Google Workspace Domain-Wide Delegation, Jira API tokens, VirusTotal, and OpenRouter configuration.

### Quick start

```bash
git clone https://github.com/snapdocs/SecureCatch.git
cd SecureCatch
npm install
cp .env.local.example .env.local
# edit .env.local with your credentials
npx prisma migrate deploy
npm run dev
```

The app will be available at **http://localhost:3000**.

## Workflow

```
1. Click "Run Ingestion"     — fetches unprocessed Jira SECOPS phishing tickets
2. Click an alert row        — opens the detail view
3. Click "Run Analysis"      — runs VirusTotal OSINT + AI classification
4. Review findings           — AI reasoning, OSINT scores, raw email content
5. Take action:
   ├── "Approve & Remediate" — domain-wide Gmail purge + close Jira ticket
   └── "Mark as Safe / Close"— false positive, close Jira ticket
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `JIRA_HOST` | Atlassian subdomain (e.g. `yourorg.atlassian.net`) |
| `JIRA_EMAIL` | Jira account email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_SECOPS_PROJECT_KEY` | Jira project key (e.g. `SECOPS`) |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `GOOGLE_SUBJECT_EMAIL` | Admin email to impersonate |
| `GOOGLE_ADMIN_EMAIL` | Super admin email for Directory API |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Model to use (e.g. `anthropic/claude-3.5-sonnet`) |
| `DATABASE_URL` | Database connection string |
