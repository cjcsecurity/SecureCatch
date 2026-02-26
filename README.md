# SecureCatch — SOAR Platform

## Overview

**SecureCatch** is a custom Security Orchestration, Automation, and Response (SOAR) web application designed to automate the triage, investigation, and remediation of user-reported phishing alerts. This platform combines a human-in-the-loop frontend dashboard with a backend automation engine that integrates with Google Workspace, Jira, VirusTotal, and a Large Language Model (LLM) via OpenRouter.

The system streamlines the phishing response workflow by automatically gathering email data, enriching it with threat intelligence, leveraging AI for initial classification, and providing analysts with a clear action path for remediation.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js (App Router), React, TypeScript |
| **UI/Styling** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **State/Data Fetching** | React Query or native Next.js Server Actions |
| **AI Integration** | OpenRouter (using the standard `openai` Node SDK configured with `baseURL: https://openrouter.ai/api/v1`) |
| **External APIs** | Google APIs Node.js Client (`googleapis`), Jira API (`jira-client` or standard `fetch`), VirusTotal API |

---

## Workflow Architecture

The phishing investigation workflow consists of three primary steps: Ingestion, Analysis, and Remediation.

### Step 1 — Ingestion

1. An analyst clicks **"Run Ingestion"** on the dashboard (manual trigger — no input required)
2. The system **queries the Jira API** for all open/unprocessed tickets on the SECOPS board where:
   - Reporter = `csirt@snapdocs.com` **OR** Summary contains `"Alert: User-reported phishing"`
3. For each ticket found, the system **parses the Description field** to extract: sender email (Actor), reporter email (Reported by), and activity date/time
4. For each ticket, the system **queries the Google Workspace API** (Gmail API or Alert Center API) using the extracted sender, reporter, and date to find the matching email
5. The system retrieves the **Google Message ID** and full email details (headers, body, links) for each ticket

**Example Jira Ticket Structure:**

```
Title/Summary: Alert: User-reported phishing for docusign.prod.pa@snapdocs.com

Reporter: csirt@snapdocs.com (raised via Email)

Description:
  Activity date: Wednesday, Dec 10, 2025, 9:01:48 PM (UTC)
  Actor: docusign.prod.pa@snapdocs.com
  Reported by: bob.jones@snapdocs.com
  Severity: HIGH
  Please view the alert center for additional details...
```

The system parses the **Description** field (not the summary/title) to extract: Actor (sender email), Reported by (recipient email), and Activity date. The sender email can also be cross-referenced from the ticket title as a quick check.

```
┌─────────────┐   "Run Ingestion"   ┌──────────────────────┐
│   Analyst   │ ──────────────────▶ │  /api/ingest/start   │
│  Dashboard  │                     │  (Next.js API Route) │
└─────────────┘                     └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │  Query Jira API      │
                                   │  reporter=csirt@     │
                                   │  snapdocs.com OR     │
                                   │  summary contains    │
                                   │  "User-reported      │
                                   │   phishing"          │
                                   └──────────────────────┘
                                            │
                                            ▼
                                   For each ticket found:
                                   Parse Description field
                                   → Sender (Actor)
                                   → Reporter (Reported by)
                                   → Activity Date
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │  Query Google API    │
                                   │  per ticket          │
                                   │  (Gmail/Alert Ctr)   │
                                   └──────────────────────┘
                                            │
                                            ▼
                                   Extract Google Message ID
                                   + Full Email Details
                                   (for each ticket)
```

### Step 2 — Analysis

The analysis phase consists of three parallel data gathering and processing operations:

#### Data Gathering
- Uses Google Workspace API (with Domain-Wide Delegation) to fetch the raw email
- Extracts: headers, body, and embedded links based on the Google Message ID

#### OSINT Enrichment
- Queries the VirusTotal API with:
  - Sender domain
  - Sender IP
  - Any extracted URLs from the email body

#### AI Analysis
- Sends headers, body, and OSINT data to OpenRouter
- The LLM system prompt instructs it to act as a Level 1 SOC Analyst
- Returns strict JSON output:

```json
{
  "classification": "Phishing|Spam|Safe",
  "confidence_score": 0-100,
  "reasoning": "string"
}
```

All results are stored and associated with the Jira ticket for later retrieval.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Analysis Pipeline                        │
├─────────────────────┬───────────────────┬───────────────────────┤
│   Data Gathering    │  OSINT Enrichment │     AI Analysis       │
│  (Google Workspace) │   (VirusTotal)    │    (OpenRouter)       │
├─────────────────────┼───────────────────┼───────────────────────┤
│ • Email headers     │ • Sender domain   │ • LLM classification  │
│ • Email body        │ • Sender IP       │ • Confidence score    │
│ • Embedded links    │ • Extracted URLs  │ • Reasoning           │
└─────────────────────┴───────────────────┴───────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Store Results  │
                    │  (Database)     │
                    └─────────────────┘
```

### Step 3 — Remediation

An analyst reviews the case on the frontend dashboard and chooses one of two actions:

#### "Approve & Remediate"

Triggers an API route that performs the following:

1. **Google Workspace Actions:**
   - Uses Google Workspace Admin SDK to quarantine the message
   - Adds the sender's email to the "Reject" address list

2. **Jira Actions:**
   - Posts a structured final comment to the Jira ticket
   - Transitions the ticket to "Closed"

**Jira Comment Template:**

```
Sent to quarantine, triaged in google admin view, reviewed headers
> checked for other targets inside Snapdocs
> checked OSINT on IoCs
> identified extent of compromise

**Results**
[AI Reasoning and Classification]

**Google Message ID**
[Google Workspace URL with Message ID]

**Follow up actions taken**
Added "[Sender Email]" to block list. Message quarantined.

**Google Block List "Reject"**
https://admin.google.com/ac/apps/gmail/manageaddresslist?addressListType=2
```

#### "Mark as Safe/Close"

- Closes the ticket as a false positive
- No remediation actions are taken
- Records the disposition for future reference and model improvement

```
┌─────────────────────────────────────────────────────────────┐
│                    Analyst Dashboard                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │  Alert Details  │        │      Available Actions      │ │
│  │  • AI Result    │        │                             │ │
│  │  • OSINT Data   │        │  [Approve & Remediate]      │ │
│  │  • Raw Email    │        │  [Mark as Safe/Close]       │ │
│  └─────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ Quarantine Msg  │         │  Close Ticket   │
    │ Block Sender    │         │  (False Pos.)   │
    │ Close Jira      │         │                 │
    └─────────────────┘         └─────────────────┘
```

---

## Development Roadmap

### Phase 1: Project Setup

- [ ] Initialize Next.js project with TypeScript, Tailwind CSS, and shadcn/ui
- [ ] Configure environment variables and project structure

### Phase 2: Backend Integration

- [ ] Build the manual trigger ingestion endpoint ([`/api/ingest/start`](api/ingest/start)) for analyst-initiated workflow
- [ ] Implement Jira API integration to fetch all phishing tickets by reporter/summary filter (reporter = `csirt@snapdocs.com` OR summary contains `"Alert: User-reported phishing"`) and parse ticket description data
- [ ] Implement Google Workspace API integration (Domain-Wide Delegation, email search by sender/recipient/date, fetch raw email)
- [ ] Implement VirusTotal OSINT enrichment module
- [ ] Implement OpenRouter AI analysis module (system prompt, JSON output parsing)

### Phase 3: Data Layer

- [ ] Build data persistence layer (to store alert state, AI results, OSINT data)

### Phase 4: Frontend

- [ ] Build the frontend dashboard (dark mode, queue table with columns: Date, Reporter, Suspect Sender, AI Confidence Score, Status)
- [ ] Build the alert detail view (AI reasoning, OSINT results, raw email display)

### Phase 5: Actions & Remediation

- [ ] Implement "Approve & Remediate" action (Google quarantine + blocklist + Jira comment/close)
- [ ] Implement "Mark as Safe/Close" action (Jira false positive close)

### Phase 6: Testing & Deployment

- [ ] End-to-end testing and hardening
- [ ] Deployment configuration

---

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `JIRA_HOST` | Your Jira instance hostname (e.g., `yourorg.atlassian.net`) |
| `JIRA_EMAIL` | Service account email for Jira API authentication |
| `JIRA_API_TOKEN` | Jira API token for the service account |
| `JIRA_SECOPS_PROJECT_KEY` | Jira project key for the SECOPS board |
| `GOOGLE_CLIENT_EMAIL` | Google service account email (for Domain-Wide Delegation) |
| `GOOGLE_PRIVATE_KEY` | Google service account private key (PEM format) |
| `GOOGLE_SUBJECT_EMAIL` | The email address to impersonate via Domain-Wide Delegation |
| `GOOGLE_ADMIN_EMAIL` | Google Workspace Admin SDK target admin email |
| `VIRUSTOTAL_API_KEY` | API key for VirusTotal OSINT lookups |
| `OPENROUTER_API_KEY` | API key for OpenRouter LLM access |
| `OPENROUTER_MODEL` | The model identifier to use via OpenRouter (e.g., `anthropic/claude-3.5-sonnet`) |
| `NEXTAUTH_SECRET` | Secret for NextAuth session signing (if auth is added later) |
| `DATABASE_URL` | Connection string for the persistence layer (e.g., PostgreSQL or SQLite) |

### Example `.env.local` Template

```bash
# Jira Configuration
JIRA_HOST=yourorg.atlassian.net
JIRA_EMAIL=service-account@yourorg.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_SECOPS_PROJECT_KEY=SECOPS

# Google Workspace Configuration
GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SUBJECT_EMAIL=admin@yourorg.com
GOOGLE_ADMIN_EMAIL=admin@yourorg.com

# VirusTotal Configuration
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# OpenRouter Configuration
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Authentication (Future Use)
NEXTAUTH_SECRET=your-nextauth-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phishing_investigation
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOAR Platform Architecture                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐  "Run Ingestion"   ┌──────────────────────────────────────────┐
│   Analyst   │ ──────────────────▶ │           Next.js Application           │
│  Dashboard  │  (No Input Needed)  │                                          │
└─────────────┘                    │  ┌────────────────────────────────────┐  │
                                   │  │           API Routes               │  │
                                   │  │  ┌──────────────────────────────┐  │  │
                                   │  │  │  /api/ingest/start           │  │  │
                                   │  │  │  (Manual Trigger Ingestion)  │  │  │
                                   │  │  └──────────────────────────────┘  │  │
                                   │  │  ┌──────────────────────────────┐  │  │
                                   │  │  │  /api/analyze                │  │  │
                                   │  │  │  (Analysis)                  │  │  │
                                   │  │  └──────────────────────────────┘  │  │
                                   │  │  ┌──────────────────────────────┐  │  │
                                   │  │  │  /api/remediate              │  │  │
                                   │  │  │  (Actions)                   │  │  │
                                   │  │  └──────────────────────────────┘  │  │
                                   │  └────────────────────────────────────┘  │
                                   │  ┌────────────────────────────────────┐  │
                                   │  │        Frontend Dashboard          │  │
                                   │  │  ┌─────────────┐ ┌──────────────┐  │  │
                                   │  │  │ Alert Queue │ │ Alert Detail │  │  │
                                   │  │  └─────────────┘ └──────────────┘  │  │
                                   │  └────────────────────────────────────┘  │
                                   └──────────────────────────────────────────┘
                                            │                    │
                    ┌───────────────────────┼────────────────────┼───────────────┐
                    │                       │                    │               │
                    ▼                       ▼                    ▼               ▼
           ┌─────────────┐          ┌─────────────┐      ┌─────────────┐ ┌─────────────┐
           │    Jira     │          │   Google    │      │ VirusTotal  │ │ OpenRouter  │
           │    API      │          │  Workspace  │      │   (OSINT)   │ │    (LLM)    │
           │ (Fetch/Post)│          │    API      │      │    API      │ │    API      │
           └─────────────┘          └─────────────┘      └─────────────┘ └─────────────┘
```

---

## Security Considerations

- **Domain-Wide Delegation:** Google Workspace integration uses Domain-Wide Delegation with a service account; ensure the service account has only the minimum required scopes
- **API Key Protection:** All API keys and secrets must be stored securely and never committed to version control
- **Input Sanitization:** All user inputs and external API responses should be sanitized before processing or display
- **Audit Logging:** Consider implementing audit logs for all remediation actions taken through the platform
- **Authentication:** Ensure proper authentication is implemented for the manual trigger endpoint to prevent unauthorized workflow initiation

---

## License

This project is proprietary and intended for internal security operations use only.

---

## Contributing

This is an internal tool. For feature requests or bug reports, please contact the Security Operations team.
