# SecureCatch — Setup Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v18+ (v20+ recommended) |
| npm | v9+ |
| Google Workspace | Admin with Domain-Wide Delegation access |
| Jira | Atlassian Cloud or Server with API token |
| VirusTotal | API key (free tier works) |
| OpenRouter | API key + model access |

---

## 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd SecureCatch
npm install
```

---

## 2. Configure Environment Variables

Copy the template and fill in your real credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```bash
# Jira Configuration
JIRA_HOST=yourorg.atlassian.net          # e.g. snapdocs.atlassian.net
JIRA_EMAIL=service-account@yourorg.com   # Jira account email
JIRA_API_TOKEN=your-jira-api-token       # From: id.atlassian.com → Security → API tokens
JIRA_SECOPS_PROJECT_KEY=SECOPS           # Your Jira project key

# Google Workspace Configuration
GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SUBJECT_EMAIL=admin@yourorg.com   # Email to impersonate (must have Gmail + Alert Center access)
GOOGLE_ADMIN_EMAIL=admin@yourorg.com     # Super Admin email for Directory API

# VirusTotal
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Database (SQLite — no changes needed for local dev)
DATABASE_URL=file:./dev.db
```

---

## 3. Google Workspace Service Account Setup

SecureCatch uses a **Google Service Account with Domain-Wide Delegation** to access Gmail, Alert Center, and the Admin SDK on behalf of users.

### 3a. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., `securecatch-soar`)
4. Click **Done** (no roles needed at this level)
5. Click on the new service account → **Keys** tab → **Add Key → Create new key → JSON**
6. Save the downloaded JSON file — you'll extract `client_email` and `private_key` from it

### 3b. Enable Domain-Wide Delegation

1. In the service account detail page, click **Edit** → check **Enable Google Workspace Domain-wide Delegation**
2. Save, then note the **Client ID** (numeric ID shown on the service account page)

### 3c. Grant OAuth Scopes in Google Admin

1. Go to [admin.google.com](https://admin.google.com) → **Security → API Controls → Domain-wide delegation**
2. Click **Add new** and enter:
   - **Client ID:** (the numeric Client ID from step 3b)
   - **OAuth Scopes:**
     ```
     https://www.googleapis.com/auth/gmail.readonly,
     https://www.googleapis.com/auth/gmail.modify,
     https://www.googleapis.com/auth/admin.directory.user.readonly,
     https://www.googleapis.com/auth/apps.alerts
     ```

### 3d. Enable Required APIs

In Google Cloud Console → **APIs & Services → Enable APIs**:
- Gmail API
- Google Workspace Alert Center API
- Admin SDK API

### 3e. Set Environment Variables

From the downloaded JSON key file:

```bash
GOOGLE_CLIENT_EMAIL=<value of "client_email" in the JSON>
GOOGLE_PRIVATE_KEY=<value of "private_key" in the JSON — keep the \n escapes>
GOOGLE_SUBJECT_EMAIL=<a Google Workspace admin email to impersonate>
GOOGLE_ADMIN_EMAIL=<same or another super admin email>
```

> **Note:** When pasting `GOOGLE_PRIVATE_KEY` into `.env.local`, keep it on one line with `\n` as literal characters (not real newlines), and wrap the whole value in double quotes.

---

## 4. Jira API Token

1. Go to [id.atlassian.com](https://id.atlassian.com) → **Security → API tokens → Create API token**
2. Copy the token and set it as `JIRA_API_TOKEN`
3. Set `JIRA_EMAIL` to the email of the Atlassian account the token belongs to
4. Set `JIRA_HOST` to your Atlassian subdomain (e.g., `yourorg.atlassian.net`)
5. Set `JIRA_SECOPS_PROJECT_KEY` to your SECOPS board project key

---

## 5. VirusTotal API Key

1. Create an account at [virustotal.com](https://www.virustotal.com)
2. Go to **Profile → API Key**
3. Copy the key and set it as `VIRUSTOTAL_API_KEY`

> **Free tier limit:** 4 requests/minute, 500/day. The app automatically rate-limits URL checks.

---

## 6. OpenRouter API Key

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys → Create key**
3. Set it as `OPENROUTER_API_KEY`
4. Set `OPENROUTER_MODEL` to your preferred model:
   - `anthropic/claude-3.5-sonnet` (recommended)
   - `openai/gpt-4o`
   - `google/gemini-flash-1.5`

---

## 7. Initialize the Database

The SQLite database is automatically created. Run migrations to set up the schema:

```bash
npx prisma migrate deploy
```

To reset the database during development:

```bash
npx prisma migrate reset
```

To inspect the database with a GUI:

```bash
npx prisma studio
```

---

## 8. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# OR use the startup script (starts dev server + opens browser)
./start.sh
```

The app will be available at **http://localhost:3000**

---

## Workflow

```
1. Open the dashboard at http://localhost:3000
2. Click "Run Ingestion" — fetches unprocessed Jira SECOPS tickets
3. Click any alert row to open the detail view
4. Click "Run Analysis" — runs VirusTotal OSINT + AI classification
5. Review: AI reasoning, OSINT scores, raw email headers/body/links
6. Choose an action:
   └── "Approve & Remediate" → domain-wide email purge + close Jira ticket
   └── "Mark as Safe / Close" → false positive, close Jira ticket
```

---

## Production Deployment

For production, switch from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in your environment:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/securecatch
   ```

2. Update `prisma/schema.prisma` datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Build and start:
   ```bash
   npm run build
   npm run start
   ```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Missing Jira configuration` | Ensure `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN` are set in `.env.local` |
| `Missing Google credentials` | Ensure `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set |
| `Alert Center API failed` | Ensure the service account has the `apps.alerts` scope granted in Google Admin |
| `Gmail API failed` | Ensure Domain-Wide Delegation is enabled and `gmail.modify` scope is granted |
| `No tickets found` | Check that your Jira project key is correct and the filter matches your ticket format |
| `AI parse error` | The model returned malformed JSON — try a different `OPENROUTER_MODEL` |
| `Database errors` | Run `npx prisma migrate deploy` to ensure schema is up to date |
