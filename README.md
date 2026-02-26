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

The phishing investigation workflow consists of three primary steps: Ingestion, Analysis, and Analyst Review & Remediation.

### Step 1 — Ingestion

1. An analyst clicks **"Run Ingestion"** on the dashboard (manual trigger — no input required)
2. The system **queries the Jira API** for all open/unprocessed tickets on the SECOPS board where:
   - Reporter = `csirt@snapdocs.com` **OR** Summary contains `"Alert: User-reported phishing"`
3. For each ticket found, the system **parses the Description field** to extract: sender email (Actor), reporter email (Reported by), and activity date/time
4. The system **queries the Google Workspace Alert Center API** using the extracted sender and date to find the exact `messageId` and `rfc2822MessageId` for the phishing alert.
5. The system uses the **Gmail API** (with Domain-Wide Delegation) to retrieve the full raw email details (headers, body, links) using the exact `messageId`.

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

The system parses the **Description** field to extract: Actor (sender email), Reported by (recipient email), and Activity date.

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
                                   │ Query Alert Ctr API  │
                                   │ → Get exact messageId│
                                   └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │   Query Gmail API    │
                                   │ → Get Raw Email      │
                                   └──────────────────────┘
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

### Step 3 — Analyst Review & Remediation

The system pauses and waits for human intervention. An analyst reviews the case on the frontend dashboard, which presents a unified view of the threat:
- **The Raw Email:** Headers, body, and extracted links.
- **AI Investigation:** The LLM's classification, confidence score, and detailed reasoning.
- **OSINT Data:** VirusTotal scores for the sender domain, IP, and URLs.

Based on this information, the analyst simply selects one of two actions:

#### "Approve & Remediate" (Domain-Wide Purge)

Triggers an API route that performs a fully automated "Search & Destroy" across the entire organization:

1. **Google Workspace Actions:**
   - Uses the Admin SDK Directory API to fetch a list of all active users in the domain.
   - Loops through every user, using the Gmail API (with Domain-Wide Delegation) to search for the exact `rfc2822MessageId`.
   - Calls `gmail.users.messages.trash` to delete the malicious email from *any* inbox where it is found.

2. **Jira Actions:**
   - Posts a structured final comment to the Jira ticket detailing the domain-wide purge.
   - Transitions the ticket to "Closed".

**Jira Comment Template:**

```
Domain-wide purge executed. Triaged in SecureCatch dashboard, reviewed headers.
> checked OSINT on IoCs
> identified extent of compromise

**Results**
[AI Reasoning and Classification]

**Follow up actions taken**
Executed domain-wide search for RFC2822 Message-ID. Message successfully trashed from all affected user inboxes.
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
    │ Domain-Wide     │         │  Close Ticket   │
    │ Purge (Trash)   │         │  (False Pos.)   │
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
- [ ] Implement Jira API integration to fetch all phishing tickets by reporter/summary filter and parse ticket description data
- [ ] Implement Google Workspace Alert Center API integration to extract exact `messageId` and `rfc2822MessageId`
- [ ] Implement Google Workspace Gmail API integration (Domain-Wide Delegation) to fetch raw email
- [ ] Implement VirusTotal OSINT enrichment module
- [ ] Implement OpenRouter AI analysis module (system prompt, JSON output parsing)

### Phase 3: Data Layer

- [ ] Build data persistence layer (to store alert state, AI results, OSINT data)

### Phase 4: Frontend

- [ ] Build the frontend dashboard (dark mode, queue table with columns: Date, Reporter, Suspect Sender, AI Confidence Score, Status)
- [ ] Build the alert detail view (AI reasoning, OSINT results, raw email display)

### Phase 5: Actions & Remediation

- [ ] Implement "Approve & Remediate" action (Admin SDK Directory API user loop + Gmail API domain-wide trash + Jira comment/close)
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