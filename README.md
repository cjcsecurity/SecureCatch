# SecureCatch

SecureCatch is a phishing-triage SOAR app built with Next.js, Prisma, and SQLite. It ingests Jira SECOPS alerts, enriches suspicious emails with Google Workspace and VirusTotal data, applies AI-assisted classification, and supports remediation workflows for approved incidents.

## Quick Start

Follow [SETUP.md](SETUP.md) to install dependencies, configure `.env.local`, initialize the database, and start the app.

All SecureCatch API routes require bearer-token authentication. Configure `SECURECATCH_API_TOKEN` before first run and send it with each `/api/*` request as described in [API Authentication](SETUP.md#3-api-authentication).
