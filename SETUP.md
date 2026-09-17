# SecureCatch setup

This guide configures a local or single-instance SecureCatch deployment. Complete the access-control setup before adding third-party credentials.

## Prerequisites

| Requirement | Supported configuration |
| --- | --- |
| Node.js | 20 or newer; use an active LTS release for deployment |
| npm | Version bundled with the selected Node release |
| Google Workspace | Administrator able to configure domain-wide delegation |
| Jira | Atlassian account with API-token access to the target project |
| VirusTotal | API key; the free tier works for low-volume testing |
| OpenRouter | API key and access to the selected model |

## 1. Install

```bash
git clone https://github.com/cjcsecurity/SecureCatch.git
cd SecureCatch
npm ci
cp .env.local.example .env.local
```

Use `npm ci` to install the reviewed lockfile exactly.

## 2. Configure operator access

Create a long, unique password. The command reads it from standard input and prints only the scrypt hash that belongs in `.env.local`:

```bash
printf '%s' 'choose-a-long-unique-password' | npm run auth:hash-password
```

Generate a separate signing secret:

```bash
openssl rand -base64 48
```

Set the results:

```dotenv
SECURECATCH_ADMIN_PASSWORD_HASH=scrypt$16384$8$1$...
SECURECATCH_SESSION_SECRET=replace-with-the-generated-random-secret
```

The password itself is never stored. Sessions expire after eight hours. Changing the signing secret invalidates every existing session.

Keep the remediation kill switch off during setup:

```dotenv
SECURECATCH_ENABLE_DESTRUCTIVE_ACTIONS=false
```

## 3. Configure Jira

Create an API token from the Atlassian account-security page. Use a dedicated account with only the project permissions SecureCatch needs.

```dotenv
JIRA_HOST=yourorg.atlassian.net
JIRA_EMAIL=service-account@yourorg.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_SECOPS_PROJECT_KEY=SECOPS
```

By default, ingestion finds open issues in that project whose summary contains `User-reported phishing`. If your intake uses a label, issue type, reporter, or custom field, set a complete query:

```dotenv
JIRA_PHISHING_JQL=project = "SECOPS" AND labels = phishing-intake AND statusCategory != Done ORDER BY created DESC
```

The expected issue description includes `Actor:`, `Reported by:`, and, optionally, `Activity date:` lines. Jira workflows differ, so validate the project’s closing transition in a test ticket before enabling production use.

## 4. Configure Google Workspace

SecureCatch uses a Google service account with domain-wide delegation to read reported messages and, when separately enabled, trash an identified message from user mailboxes.

### Create the service account

1. In Google Cloud Console, open **IAM & Admin > Service Accounts**.
2. Create a service account without project roles.
3. Open the account, select **Keys > Add key > Create new key**, and download the JSON key.
4. Edit the service account and enable Google Workspace domain-wide delegation.
5. Record its numeric OAuth client ID.

Store the private key outside the repository. Never commit `.env.local` or the downloaded JSON file.

### Grant OAuth scopes

In Google Admin, open **Security > API controls > Domain-wide delegation** and add the service account client ID with these scopes:

```text
https://www.googleapis.com/auth/gmail.readonly,
https://www.googleapis.com/auth/gmail.modify,
https://www.googleapis.com/auth/admin.directory.user.readonly,
https://www.googleapis.com/auth/apps.alerts
```

`gmail.modify` enables destructive mailbox actions. If you are evaluating only the interface or analysis flow, use a test Workspace and leave the SecureCatch remediation kill switch disabled.

Enable these APIs in the Google Cloud project:

- Gmail API
- Google Workspace Alert Center API
- Admin SDK API

Add the credentials to `.env.local`:

```dotenv
GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SUBJECT_EMAIL=admin@yourorg.com
GOOGLE_ADMIN_EMAIL=admin@yourorg.com
```

Keep `GOOGLE_PRIVATE_KEY` on one line, preserve literal `\n` sequences, and wrap the value in double quotes.

## 5. Configure analysis services

Create a VirusTotal API key and an OpenRouter API key, then set:

```dotenv
VIRUSTOTAL_API_KEY=your-virustotal-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

Choose any OpenRouter model that supports JSON-object responses. VirusTotal’s public API is rate-limited; SecureCatch spaces URL lookups, but your account’s current quota remains authoritative.

Email evidence is sent to the configured model provider for classification, and indicators are sent to VirusTotal for enrichment. Confirm that this fits your organization’s data-handling rules.

## 6. Initialize the database

The included schema uses SQLite:

```dotenv
DATABASE_URL=file:./dev.db
```

Apply the committed migration and generate the Prisma client:

```bash
npm run db:migrate
npm run db:generate
```

For local inspection:

```bash
npx prisma studio
```

SQLite requires persistent local storage and one application instance. Moving to PostgreSQL is a schema and migration change; do not point the existing SQLite migration at a PostgreSQL URL.

## 7. Validate before connecting production data

```bash
npm run check
```

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and validate this sequence:

1. Run ingestion against a test Jira project.
2. Open an alert and run analysis.
3. Review the headers, message, indicators, classification, and confidence.
4. Use **Mark as safe / close** only after confirming the Jira transition behavior.
5. Verify logs and database state after every external action.

## 8. Enable remediation only after a dry run

Domain-wide remediation can alter every mailbox in the delegated Workspace domain. Before enabling it:

- use a test Workspace or a tightly controlled test message;
- confirm the RFC 2822 Message-ID resolution;
- review the service account scopes and impersonated administrator;
- confirm operator authentication and HTTPS at the deployment boundary;
- back up the SQLite database;
- verify Jira comments and closing transitions.

Then set the server-side kill switch and restart the application:

```dotenv
SECURECATCH_ENABLE_DESTRUCTIVE_ACTIONS=true
```

The UI still requires an authenticated analyst, an alert in `AWAITING_REVIEW`, completed analysis, and exact entry of the Jira ticket key.

## Production boundary

Build and start the application with:

```bash
npm run build
npm run start
```

Deploy it only on an internal network or behind an identity-aware access proxy. Terminate TLS before traffic reaches the app, keep all secrets in the platform’s secret manager, persist and back up the database, and restrict outbound access to the integration endpoints you use.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Authentication is not configured` | Password hash and signing secret are present; signing secret is at least 32 characters |
| `Invalid credentials` | The plaintext password matches the value used to generate the scrypt hash |
| `Missing Jira configuration` | Jira host, email, token, and project key are set |
| `Missing Google credentials` | Service account email and escaped private key are set |
| Alert Center request fails | Alert Center API is enabled and `apps.alerts` was delegated |
| Gmail request fails | Gmail API is enabled and required Gmail scopes were delegated |
| No tickets are found | Project key and the ticket format expected by the ingestion parser match your test issue |
| Model response is rejected | Selected model supports JSON-object output and returned the required classification schema |
| Remediation is disabled | Keep it disabled during setup; otherwise check the server-side kill switch after completing the dry-run checklist |
| Alert is `ACTION_FAILED` | Inspect server logs and both external systems before retrying; an earlier step may already have succeeded |
