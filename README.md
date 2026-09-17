# SecureCatch

SecureCatch is a human-in-the-loop phishing triage console for Google Workspace and Jira. It gathers reported-email evidence, enriches indicators with VirusTotal, asks a configured OpenRouter model for a structured classification, and presents the result for analyst review.

Remediation is deliberately gated. A signed administrator session is required for every page and API route, state transitions are claimed atomically, domain-wide deletion is disabled by default, and an analyst must type the Jira ticket key before a purge can begin.

## What it does

1. Ingests open phishing reports from a Jira project.
2. Resolves the corresponding message through Google Workspace Alert Center and Gmail.
3. Extracts headers, message text, sender data, and links.
4. Enriches domains, IPs, and URLs with VirusTotal.
5. Produces a validated `Phishing`, `Spam`, or `Safe` assessment through OpenRouter.
6. Pauses in `AWAITING_REVIEW` for an analyst decision.
7. Optionally trashes the matching RFC 2822 message across Workspace accounts and updates Jira.

The model never acts on its own. Its output is advisory, must match a strict JSON schema, and cannot bypass the review and confirmation controls.

## Safety model

- **Private operator access:** an administrator password creates an eight-hour, HMAC-signed, `HttpOnly`, `SameSite=Strict` session.
- **Protected APIs:** route-level authorization remains in place even if the Next.js proxy is changed accidentally.
- **CSRF resistance:** state-changing endpoints reject requests without a same-origin signal.
- **Fail-closed remediation:** `SECURECATCH_ENABLE_DESTRUCTIVE_ACTIONS` defaults to `false`.
- **Explicit confirmation:** a domain-wide purge requires the exact Jira ticket key.
- **Single-action claims:** an atomic database transition prevents two operators from starting the same action.
- **Untrusted evidence boundaries:** email content and threat-intelligence fields are marked as untrusted in the model prompt.
- **Safe parse failures:** malformed model output is rejected instead of being stored as analysis.

SecureCatch is designed as an internal, single-administrator tool. Put deployed instances behind a private network or identity-aware access proxy as an additional boundary. Review Google Workspace delegation scopes before enabling remediation.

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS
- Prisma with SQLite for a local or single-instance deployment
- Google Workspace APIs: Gmail, Alert Center, and Admin SDK
- Jira REST API
- VirusTotal API
- OpenRouter-compatible chat completions

## Quick start

Prerequisites: Node.js 20 or newer; npm; and credentials for the integrations you plan to use.

```bash
git clone https://github.com/cjcsecurity/SecureCatch.git
cd SecureCatch
npm ci
cp .env.local.example .env.local
```

Generate the two access-control values and place them in `.env.local`:

```bash
printf '%s' 'choose-a-long-unique-password' | npm run auth:hash-password
openssl rand -base64 48
```

Then initialize and run the app:

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. Keep `SECURECATCH_ENABLE_DESTRUCTIVE_ACTIONS=false` while validating ingestion and analysis with your environment.

The complete Google Workspace, Jira, and API configuration is in [SETUP.md](SETUP.md).

## Development checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run check` runs all four. Pull requests run the same checks in GitHub Actions.

The tests cover signed-session validation, remediation policy gates, and strict model-response parsing. External services are not contacted during the test suite.

## Workflow states

```text
PENDING -> INGESTED -> ANALYSIS_RUNNING -> AWAITING_REVIEW
                            |                   |
                    ANALYSIS_FAILED             +------------------+
                                                |                  |
                                             CLOSING          REMEDIATING
                                                |                  |
                                              CLOSED           REMEDIATED
                                                \                  /
                                                 +-- ACTION_FAILED
```

An `ACTION_FAILED` result means the operator should inspect server logs and verify external-system state before retrying or taking manual action. A failure may occur after an external API has completed part of a multi-step operation.

## Operational limitations

- SQLite is appropriate for local use or one application instance with persistent storage. A multi-instance deployment needs a shared database and a reviewed Prisma migration strategy.
- Domain-wide remediation uses delegated Gmail access and performs one mailbox operation at a time. Test with a constrained Workspace environment first.
- Jira workflow transition IDs vary by project. Confirm the configured transition behavior before using it against production tickets.
- OpenRouter and VirusTotal receive the evidence sent by their respective integration code. Apply your organization’s data-handling rules before connecting real mail.

## Security reports

Please avoid posting exploitable details in a public issue. Use the repository’s private vulnerability-reporting option under the **Security** tab when available.
