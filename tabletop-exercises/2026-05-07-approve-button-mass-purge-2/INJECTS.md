# INJECTS — Burning the Inbox (live deck)

> Standalone inject deck pulled out of `RUNBOOK.md` for fast reference during play. The full read-aloud opener and decision points live in the runbook; this file is what you flip through with one hand on the timer.

## At a glance

| T+ | Inject | Branch? | Owner |
|----|--------|---------|-------|
| 0:00 | Phase 1 read-aloud opener (in runbook) | — | Facilitator |
| 0:03 | 1.1 — Helpdesk Slack lights up | yes — 3 branches | Holly (Helpdesk) |
| 0:08 | 1.2A — Purge is still running | — | Linnea (Eng) |
| 0:08 | 1.2B — Helpdesk floods past 30 + delayed eng warning | — | Holly + Linnea |
| 0:10 | 1.2C — *Wild card*: Bo interrupts the bridge | — | Bo (COO) |
| 0:18 | Decision Point 1: kill or let it ride | — | IC |
| 0:18 | Phase 2 read-aloud bridge (in runbook) | — | Facilitator |
| 0:19 | 2.1 — Scope dump | yes — 2 branches | Linnea |
| 0:25 | 2.2A — TechCrunch DM | — | Marcus (Comms) |
| 0:25 | 2.2B — Acme Robotics customer escalation | — | Holly (CS) |
| 0:31 | 2.3 — Bo loops back | — | Bo |
| 0:36 | Decision Point 2: comms posture | — | Comms / IC / Exec |
| 0:36 | Phase 3 read-aloud bridge (in runbook) | — | Facilitator |
| 0:37 | 3.1 — General Counsel arrives | — | Mira |
| 0:44 | 3.2 — Root cause + undocumented kill switch | yes — 3 branches | Linnea |
| 0:48 | 3.3A — Kill switch did not work | — | Linnea |
| 0:48 | 3.3B — Revert lost AI enrichment too | — | Linnea |
| 0:48 | 3.3C — Real phish landed during downtime | — | Holly |
| 0:52 | Decision Point 3: stay live, degraded, or dark | — | Exec / GC / Eng |
| 0:52 | Phase 3 closing read-aloud (in runbook) | — | Facilitator |
| 0:52 | Hotwash (10 questions, in runbook) | — | Facilitator |

---

## Inject 1.1 — Helpdesk Slack lights up (T+3)

Posted into `#incident-bridge` by Holly:

> @here — getting a flood. Last 4 minutes:
> - 11 tickets, "missing emails", various depts
> - 3 are HR thread
> - 1 is from Bo (COO!): "where did the 7am board prep email go"
> - 1 is from outside counsel's office: "did you delete a thread we sent yesterday"
> Something is eating mail across the org.

🌿 **Branch on team's response within 4 minutes:**
- Engineering-first → 1.2A
- Helpdesk-first → 1.2B
- No concrete action → 1.2C

---

## Inject 1.2A — The purge is still running (T+8)

> Looked at the server. The remediate route is mid-loop. Logs are still emitting `Trashed message for user@…` once every 1–2 sec. We're at user 487 of 1,194. ETA to finish: ~9 more minutes if I let it run.
>
> No graceful abort. No feature flag wired. To stop it I have to either `kill -9` the Node process or restart the host. If I kill it mid-run, **`purgeResults` never gets written to the DB** — meaning we lose the audit trail of which users were affected. If I let it finish, ~700 more mailboxes get hit. Need a call. Now.

---

## Inject 1.2B — Helpdesk floods past 30 (T+8)

From Holly:

> Up to 34 tickets. Two C-suite EAs are on the phone with me. People are forwarding screenshots of "email gone" — some of them are obviously legit corporate mail. I can't keep up at this rate.

Then 90 seconds later, **unprompted from Linnea:**

> FYI — SecureCatch is *still running the purge*. I just realized when I tailed the logs. We're at user 580-ish of 1,194. Do we kill it or what.

---

## Inject 1.2C — Bo interrupts (T+10) — wild card

Bo joins the bridge unannounced:

> 👤 *Bo, calm but tight, no preamble:* "I've got two board members on email asking why their advisors said our company-wide deletion is on Twitter. Someone tell me what is happening, in one sentence, right now."

---

## Decision Point 1 (T+18) — Stop or let it ride

(See runbook. Owner: IC. Document in `forms/decision-log.md`.)

---

## Inject 2.1 — Scope dump (T+19)

> Numbers as of right now (lossy if we killed it mid-run):
> - 487 users had emails moved to Trash
> - Trashed messages count: best estimate **3,847** across all users
> - **Important**: trash is per-user Gmail Trash, recoverable for 30 days via `gmail.users.messages.untrash`. Not permadeleted. (Yet.)
>
> But — the search query was `rfc822msgid:<one specific Message-ID>`. We expected that to be unique. It wasn't. It collided with a regular automated email that uses the same Message-ID format. Investigating now.

🌿 **Branch:**
- Recovery in parallel → 2.2A
- Diagnosis-first → 2.2B

---

## Inject 2.2A — TechCrunch DM (T+25)

Marcus, holding his phone up:

> 👤 "Reporter from TechCrunch just DM'd Rae on Twitter. Quote: 'Hearing your company is in the middle of a massive accidental email deletion. Got 30 seconds for comment before I publish?' He's got a deadline of 10:30 — 25 minutes from now. He used the word *accidental*, which means he has a source inside."

---

## Inject 2.2B — Acme Robotics customer escalation (T+25)

From Holly:

> CS just escalated me. **Acme Robotics** — top-10 customer, $4.2M ARR — opened a P1: *"Several of our team members are reporting missing emails from our shared SecureCatch alert workflow. Has our data been compromised?"* They're on a call with their security team in 35 minutes. They want a written confirmation of impact before that call.

---

## Inject 2.3 — Bo loops back (T+31)

Bo Reyes:

> 👤 *Bo, slightly winded:* "Rae — I just got off with Pat in HR. They told me the email Theo purged this morning was a phishing impersonation of *me*, telling people to wire money. So the purge was *correct in principle*, just wildly overscoped. I want to be clear: I am not blaming Theo. I am asking what we tell the company in the next thirty minutes, before someone forwards this to TechCrunch with their own framing."

---

## Decision Point 2 (T+36) — Comms posture

(See runbook. Owner: Comms / IC / Exec. Document in `forms/decision-log.md`.)

---

## Inject 3.1 — General Counsel arrives (T+37)

Mira Okafor, calm, exact:

> 👤 "Walk me through this. — Right. I need to know, with confidence, whether any email between **Patricia Singh**, **HR**, and **Greco & Lin** outside counsel — dating back to January 14, 2026 — was touched. Those emails are under a written litigation hold for an active arbitration. Outside counsel for the other side files their discovery response by 17:00 today. If those emails are gone — even if we recover them tonight — we have to disclose. Spoliation. So I need a sworn list of affected message IDs and a sworn timeline, in writing, by 14:00. Not a verbal."

---

## Inject 3.2 — Root cause + undocumented kill switch (T+44)

Linnea:

> Got it. The purge query is `rfc822msgid:<id>` — which Gmail honors as exact match. The Message-ID we used came from the AI enrichment step in `lib/ai.ts`, which **normalizes** Message-IDs by stripping a date suffix. So `phish-2026-05-07-a8b9c@evil.com` got normalized to `phish@evil.com` — and that **collided** with a no-reply notification system that uses short-form Message-IDs like `notify@evil.com`. The phisher chose their domain on purpose; the AI helped them blast wider. Effectively: a model regression weaponized the SOAR.
>
> **Also**: I just found a feature flag `FEATURE_FLAGS.disable_approve_remediate` added two weeks ago in commit `7d3f1ac` by someone on my team. There's no test for it. There's no docs for it. I have *no idea* if it actually short-circuits the route or if the commit was wishful thinking. We can flip it now — production traffic — and find out. Or we can `git revert` the entire enrichment commit and redeploy, which takes ~12 minutes. Or we put SecureCatch behind an HTTP 503 banner page until tomorrow.

🌿 **Branch:**
- Flip the kill switch → 3.3A
- Revert and redeploy → 3.3B
- Take the product offline (503) → 3.3C

---

## Inject 3.3A — The kill switch did not work (T+48)

Linnea:

> Flag flipped. Just tested it on a dummy alert. Route still ran. The flag was wishful thinking. The commit added the constant but never plumbed it into the route handler. We are now back to "revert or 503" with five fewer minutes of runway.

---

## Inject 3.3B — Revert lost AI enrichment too (T+48)

Linnea:

> Reverted, redeployed in 11 minutes. Side effect: AI enrichment is *also* off — that was in the same module. Analysts can still triage but they're working without classification. SOC throughput will be roughly 3x slower. Acceptable for a day. Costly for a week.

---

## Inject 3.3C — Real phish landed during downtime (T+48)

Holly:

> While we were 503'd, a real phishing wave hit the org. Helpdesk caught 6 user reports in the last 8 minutes, all the same payload, all asking for OAuth grants. Without SecureCatch, the SOC is triaging by hand. Recommend we re-enable the *triage* parts of SecureCatch even if Approve & Remediate stays off.

---

## Decision Point 3 (T+52) — Stay live, degraded, or dark

(See runbook. Owner: Exec, with binding input from GC and Eng Lead. Document in `forms/decision-log.md`.)

---

## Closing read-aloud + Hotwash

(See runbook for full text.)
