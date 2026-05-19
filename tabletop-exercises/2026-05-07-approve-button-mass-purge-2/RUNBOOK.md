# Burning the Inbox — Approve & Remediate Goes Wide

> **Domain**: prodsec / IR · **Duration**: 60m · **Audience**: eng+leadership · **Difficulty**: intermediate
> Generated 2026-05-07 for SecureCatch (`securecatch-init` · Next.js 16.2.4 · Prisma · SQLite · Google Workspace DWD)

## Quick reference

| # | Phase | T-window | Key decision | Tested capability |
|---|-------|----------|--------------|-------------------|
| 1 | What did I just do? | T+0 → T+18 | Kill the in-flight purge or let it finish | Detection-to-containment time |
| 2 | How wide? | T+18 → T+36 | Press / customer / internal comms posture | Cross-functional comms under bad facts |
| 3 | The litigation hold | T+36 → T+52 | Stay live, kill-switch the product, or full takedown | Legal-engineering trade-offs under spoliation risk |

Hotwash runs T+52 → T+60.

## Legend

- 📢 Read-aloud — facilitator says verbatim. Don't paraphrase or skip; the wording is doing work.
- 💉 Inject — revealed at the marked time. Hidden from participants beforehand. The HTML runbook collapses these by default.
- ⚡ Decision point — team must choose. Document the choice in `forms/decision-log.md`.
- 🌿 Branch — different next-injects depending on the choice. Facilitator picks the matching branch and continues.
- 👤 NPC voice — facilitator (or designated player) plays a role. Voice cues in italics under the line.
- 🎯 Capability tested — what this inject or decision is probing for in the scoring rubric.

## Scenario summary

It is 09:14 on a Tuesday morning. SecureCatch — your phishing-triage SOAR — has been live in production for six weeks and the team is quietly proud of it. SOC analysts triage Jira SECOPS tickets, the AI enrichment step labels confidence, and a single button labelled **"Approve & Remediate"** runs a domain-wide Gmail purge against 1,200 user mailboxes via Google Workspace Domain-Wide Delegation. It has, until today, worked.

At 09:14:02 a Tier-2 analyst clicks **Approve & Remediate** on alert `phl_4f2c…b8`, an apparent CEO-impersonation phish flagged 92% by the AI model. Within sixty seconds the helpdesk Slack lights up: people across Engineering, Sales, and HR are reporting that *legitimate* emails have vanished. By T+0 of this exercise, the purge loop in `app/api/remediate/[id]/route.ts` is roughly one-third of the way through the user list — sequential, no abort signal, and the database row for `purgeResults` has not yet been written.

Outside the building, the day is also unusual. Outside counsel for an active arbitration is due to file a discovery response by 17:00 today. The CEO is rehearsing remarks for a 16:00 board update. A reporter at TechCrunch has a Google Alert configured for your company name. None of those people know about SecureCatch yet. Some of them are about to.

## Roles & responsibilities

| Role | Played by | Owns |
|------|-----------|------|
| Facilitator | _________ | Pacing, injects, timekeeping, calling branches |
| Evaluator (optional) | _________ | Notes, scoring against the rubric, hotwash prompts |
| Incident Commander (CISO) — *Dr. Rae Chen* | _________ | Bridge, severity, escalation, all-clear |
| SecureCatch Engineering Lead — *Linnea Strand* | _________ | Code-level diagnosis, kill-switch, hot-fix decisions |
| SOC Analyst on-call — *Theo Park* | _________ | The clicker; analyst-side timeline; what they saw and when |
| Comms / PR Lead — *Marcus Vee* | _________ | Internal email, status page, press posture, reporter inbound |
| General Counsel — *Mira Okafor* | _________ | Litigation hold, spoliation risk, regulator clock |
| Helpdesk / CS Lead — *Holly Tran* | _________ | User-facing triage, recovery comms, ticket triage |
| Executive Sponsor (COO) — *Bo Reyes* | _________ | Business posture, customer-trust call, kill-the-product call |

> **Small-team variant**: collapse to 5 by combining IC + Exec Sponsor (one person), and Comms + Helpdesk (one person). Keep Eng Lead, SOC Analyst, and General Counsel as their own roles — the exercise leans hard on each of them.

## Pre-exercise setup (T-pre)

- [ ] Send `PARTICIPANT-PACKET.md` to attendees ≥ 24 hours before
- [ ] Confirm role assignments (use `forms/attendance.md`)
- [ ] Print or pull up `forms/decision-log.md` and `forms/timeline-reconstruction.md`
- [ ] Open `RUNBOOK.html` in a browser if facilitating live (the in-runbook timer makes pacing easier)
- [ ] Read through `INJECTS.md` once end-to-end so you can see the branches before you have to call them
- [ ] Have the SecureCatch repo open to `app/api/remediate/[id]/route.ts` and `lib/google.ts` — Phase 3's root-cause inject lands harder if engineers can read the actual loop
- [ ] Stage a fake Slack thread on a printout if you want the helpdesk inject to feel real (optional but effective)
- [ ] Print `forms/aar-template.md` for the IC; they will want a place to scribble action items as Phase 3 goes

---

## Phase 1 — What did I just do? (T+0 to T+18)

### 📢 Read-aloud opener

> It is Tuesday, May 7th, 9:14 AM. The third coffee of the morning is half-drunk on Theo's desk. The Jira SECOPS board has eight new alerts overnight; six are obvious spam and the AI model has already auto-classified them. The seventh — `phl_4f2c…b8` — is flagged 92% phishing: a CEO impersonation, subject line *"Quick favor — board prep"*, body asking three people to wire a deposit to a vendor before lunch. Theo opens the alert, scans the headers, glances at the VirusTotal panel — sender domain blacklisted across 14 engines — and clicks **Approve & Remediate**.
>
> A toast in the corner says *"Domain-wide purge initiated."* Theo takes a sip. At 9:14:43 — forty-one seconds later — the Helpdesk Slack channel `#help-desk` lights up with the first message: *"hey is anyone else's inbox suddenly missing the Q2 OKR thread?"* Two more arrive in the next twenty seconds. Theo's stomach drops. They open a second tab and type into the engineering channel: *"Uh… I think SecureCatch did something weird."*

### 🎯 Capabilities tested in this phase
- Detection: how fast does the team move from a vague helpdesk ping to a declared incident?
- Containment instinct: do they reach for the in-flight purge first, or do they investigate first?
- Forensic discipline: do they preserve the analyst's session state and Slack history before anyone closes a tab?

### 💉 Inject 1.1 — Helpdesk Slack lights up (T+3)

**Posted by Holly (Helpdesk Lead) into `#incident-bridge` at 9:17 — facilitator reads aloud or shows on screen:**

> @here — getting a flood. Last 4 minutes:
> - 11 tickets, "missing emails", various depts
> - 3 are HR thread
> - 1 is from Bo (COO!): "where did the 7am board prep email go"
> - 1 is from outside counsel's office: "did you delete a thread we sent yesterday"
> Something is eating mail across the org.

**🌿 Branch on team's response within 4 minutes:**
- If the team **declares an incident, pages the IC, and asks Engineering to confirm whether the SecureCatch purge is still running** → proceed to **Inject 1.2A**
- If the team **investigates from the helpdesk side first** (pulling individual tickets, asking users for screenshots) without touching the SecureCatch process → proceed to **Inject 1.2B**
- If the team takes no concrete action in 4 minutes → drop **Inject 1.2C** (the wild-card escalator)

### 💉 Inject 1.2A — The purge is *still running* (T+8) — fires if team went straight to engineering

**From Linnea, Engineering Lead, in `#incident-bridge`:**

> Looked at the server. The remediate route is mid-loop. Logs are still emitting `Trashed message for user@…` once every 1–2 sec. We're at user 487 of 1,194. ETA to finish: ~9 more minutes if I let it run.
>
> No graceful abort. No feature flag wired. To stop it I have to either `kill -9` the Node process or restart the host. If I kill it mid-run, **`purgeResults` never gets written to the DB** — meaning we lose the audit trail of which users were affected. If I let it finish, ~700 more mailboxes get hit. Need a call. Now.

**🎯 Capability tested**: do they understand the trade-off between containment and evidence?

### 💉 Inject 1.2B — Helpdesk floods past 30 (T+8) — fires if team triaged at helpdesk first

**From Holly:**

> Up to 34 tickets. Two C-suite EAs are on the phone with me. People are forwarding screenshots of "email gone" — some of them are obviously legit corporate mail. I can't keep up at this rate.

Then 90 seconds later, **from Linnea, unprompted:**

> FYI — SecureCatch is *still running the purge*. I just realized when I tailed the logs. We're at user 580-ish of 1,194. Do we kill it or what.

**🎯 Capability tested**: did delaying engineering involvement cost the team containment time?

### 💉 Inject 1.2C — Wild card: an exec stops the bridge (T+10) — fires only if team froze

**Bo Reyes (COO) joins the bridge unannounced:**

> 👤 *Bo, calm but tight, no preamble:* "I've got two board members on email asking why their advisors said our company-wide deletion is on Twitter. Someone tell me what is happening, in one sentence, right now."

**Where this NPC pushes**: forces the team out of analysis paralysis with an exec who needs an answer in their next breath.

### ⚡ Decision point 1 — Stop or let it ride

**The choice**: Engineering can either (a) kill the Node process now — stops further damage, but loses the audit trail of which users were already purged because `purgeResults` is only written after the loop completes; or (b) let the loop finish — full audit trail, but ~700 more mailboxes get hit while the team watches.

There is also a third option some teams find on their own: **add a runtime patch / DB-level snapshot of the in-progress logs before killing**, preserving evidence at the cost of 2–3 minutes of additional damage. Reward this if it surfaces.

**Owns this call**: Incident Commander (Dr. Rae Chen), advised by Engineering Lead.

**Document in decision log**: who made the call, T+time, rationale, what evidence preservation steps were committed to alongside the call.

---

## Phase 2 — How wide? (T+18 to T+36)

### 📢 Read-aloud bridge

> The purge has either stopped or it hasn't, but either way the room can now feel its shape. The DB shows `purgeResults` populated for the affected alert: `usersSearched: 1194, usersAffected: 487` — or `null`, if you killed it mid-run, in which case Linnea is grepping logs to reconstruct the count by hand. Helpdesk has crossed 80 tickets. Customer Success has the first inbound ticket from a *paying customer* who notices their account-management thread has gone dark. And on Twitter, the first mention of the company name in a context that is not your marketing team has just appeared.

### 🎯 Capabilities tested in this phase
- Scope expansion handling — separating "internal pain" from "external/customer-impacting" and "press"
- Comms cadence — do they choose a clear sequence (internal → customers → press) or improvise?
- Exec alignment — does the IC keep the COO informed without losing operational tempo?

### 💉 Inject 2.1 — Scope dump (T+19)

**From Linnea, posted to the bridge:**

> Numbers as of right now (lossy if we killed it mid-run):
> - 487 users had emails moved to Trash
> - Trashed messages count: best estimate **3,847** across all users
> - **Important**: trash is per-user Gmail Trash, recoverable for 30 days via `gmail.users.messages.untrash`. Not permadeleted. (Yet.)
>
> But — the search query was `rfc822msgid:<one specific Message-ID>`. We expected that to be unique. It wasn't. It collided with a regular automated email that uses the same Message-ID format. Investigating now.

**🌿 Branch on team's response:**
- If the team **immediately starts on a recovery plan** (untrash + customer comms parallel) → proceed to **Inject 2.2A**
- If the team **stays in diagnosis mode** (wants RCA before recovery) → proceed to **Inject 2.2B**

### 💉 Inject 2.2A — TechCrunch DM (T+25) — fires if team moved to recovery

**Marcus (Comms) reads aloud, voice flat:**

> 👤 *Marcus, holding his phone up:* "Reporter from TechCrunch just DM'd Rae on Twitter. Quote: 'Hearing your company is in the middle of a massive accidental email deletion. Got 30 seconds for comment before I publish?' He's got a deadline of 10:30 — 25 minutes from now. He used the word *accidental*, which means he has a source inside."

**Where this NPC pushes**: forces a press-comms decision before the team has confirmed scope or RCA.

### 💉 Inject 2.2B — Customer-facing impact lands (T+25) — fires if team stayed in diagnosis

**From Holly:**

> CS just escalated me. **Acme Robotics** — top-10 customer, $4.2M ARR — opened a P1: *"Several of our team members are reporting missing emails from our shared SecureCatch alert workflow. Has our data been compromised?"* They're on a call with their security team in 35 minutes. They want a written confirmation of impact before that call.

**Where this NPC pushes**: forces the team to commit to a customer-facing answer with incomplete information.

### 💉 Inject 2.3 — Bo loops back (T+31)

**Bo Reyes, into the bridge:**

> 👤 *Bo, slightly winded, sounds like they've been on a call:* "Rae — I just got off with Pat in HR. They told me the email Theo purged this morning was a phishing impersonation of *me*, telling people to wire money. So the purge was *correct in principle*, just wildly overscoped. I want to be clear: I am not blaming Theo. I am asking what we tell the company in the next thirty minutes, before someone forwards this to TechCrunch with their own framing."

**Where this NPC pushes**: reframes the situation — this wasn't a malicious or even purely-buggy decision; the alert was real. This is a "right action, wrong blast radius" event. Some participants will get protective of Theo here, which is good — let it surface.

### ⚡ Decision point 2 — Comms posture

**The choice**: Pick one of (a) silent until RCA is done, (b) terse internal-only ack now ("we are aware of an email-system issue, more soon"), (c) all-hands internal email plus a holding statement to press, (d) full transparency including RCA-in-progress published to status page.

Each option has a real cost. (a) lets a reporter define the story; (d) commits to facts the team has not finished verifying. The right answer is *probably* (b) or (c) — but the team has to *justify* their pick.

**Owns this call**: Comms Lead (Marcus), with concurrence from IC and Exec Sponsor.

**Document in decision log**: who made the call, T+time, what was published, who approved the wording, what's the plan to update.

---

## Phase 3 — The litigation hold (T+36 to T+52)

### 📢 Read-aloud bridge

> Whatever you decided about comms, the next person walking into the room does not care. Mira Okafor — General Counsel — has been on a call with outside counsel for the last twenty minutes. She closes her laptop, looks up, and walks over to the bridge.

### 🎯 Capabilities tested in this phase
- Legal-engineering interface — does the team understand spoliation and chain-of-custody?
- Trade-off discipline — keeping a degraded product live vs. taking it offline entirely
- Recovery sequencing — who gets their email back first, and on what authority

### 💉 Inject 3.1 — General Counsel arrives (T+37)

**👤 Mira Okafor, calm, exact, no rush:**

> "Walk me through this. — Right. I need to know, with confidence, whether any email between **Patricia Singh**, **HR**, and **Greco & Lin** outside counsel — dating back to January 14, 2026 — was touched. Those emails are under a written litigation hold for an active arbitration. Outside counsel for the other side files their discovery response by 17:00 today. If those emails are gone — even if we recover them tonight — we have to disclose. Spoliation. So I need a sworn list of affected message IDs and a sworn timeline, in writing, by 14:00. Not a verbal."

**🎯 Capability tested**: the team must convert the engineering audit trail (which may be partial if Phase 1 chose to kill the process) into a defensible written timeline. Watch how they handle the gap between "we mostly know" and "we can swear under penalty of perjury."

### 💉 Inject 3.2 — Root cause + an undocumented kill switch (T+44)

**From Linnea, in the bridge:**

> Got it. The purge query is `rfc822msgid:<id>` — which Gmail honors as exact match. The Message-ID we used came from the AI enrichment step in `lib/ai.ts`, which **normalizes** Message-IDs by stripping a date suffix. So `phish-2026-05-07-a8b9c@evil.com` got normalized to `phish@evil.com` — and that **collided** with a no-reply notification system that uses short-form Message-IDs like `notify@evil.com`. The phisher chose their domain on purpose; the AI helped them blast wider. Effectively: a model regression weaponized the SOAR.
>
> **Also**: I just found a feature flag `FEATURE_FLAGS.disable_approve_remediate` added two weeks ago in commit `7d3f1ac` by someone on my team. There's no test for it. There's no docs for it. I have *no idea* if it actually short-circuits the route or if the commit was wishful thinking. We can flip it now — production traffic — and find out. Or we can `git revert` the entire enrichment commit and redeploy, which takes ~12 minutes. Or we put SecureCatch behind an HTTP 503 banner page until tomorrow.

**🌿 Branch on team's choice:**
- If team **flips the kill switch** → proceed to **Inject 3.3A**
- If team **reverts and redeploys** → proceed to **Inject 3.3B**
- If team **takes the product offline (503)** → proceed to **Inject 3.3C**

### 💉 Inject 3.3A — The kill switch did not work (T+48)

**From Linnea:**

> Flag flipped. Just tested it on a dummy alert. Route still ran. The flag was wishful thinking. The commit added the constant but never plumbed it into the route handler. We are now back to "revert or 503" with five fewer minutes of runway.

### 💉 Inject 3.3B — The revert is fine, but the AI enrichment goes with it (T+48)

**From Linnea:**

> Reverted, redeployed in 11 minutes. Side effect: AI enrichment is *also* off — that was in the same module. Analysts can still triage but they're working without classification. SOC throughput will be roughly 3x slower. Acceptable for a day. Costly for a week.

### 💉 Inject 3.3C — 503 holds, but a real phish lands (T+48)

**From Holly:**

> While we were 503'd, a real phishing wave hit the org. Helpdesk caught 6 user reports in the last 8 minutes, all the same payload, all asking for OAuth grants. Without SecureCatch, the SOC is triaging by hand. Recommend we re-enable the *triage* parts of SecureCatch even if Approve & Remediate stays off.

### ⚡ Decision point 3 — Stay live, degraded, or dark

**The choice**: Given (a) Mira's 14:00 deadline for the sworn list, (b) recovery work that has to happen across 487 user mailboxes, (c) an active threat environment that the SOC depends on SecureCatch for, and (d) press and customer comms still in flight — does the company keep SecureCatch operational with the kill switch, run it degraded (read-only triage, no remediation), or take it offline until the AAR is signed?

**Owns this call**: Executive Sponsor (Bo Reyes) with binding input from General Counsel and Engineering Lead.

**Document in decision log**: posture chosen, conditions for re-enabling Approve & Remediate, who has the authority to flip it back on.

### 📢 Closing read-aloud

> The clock on the wall says 10:06. SecureCatch is — in whatever posture you've chosen — running, half-running, or off. Linnea is writing the revert commit message. Mira is starting on the sworn timeline. Marcus is on the phone with the TechCrunch reporter. Holly is approving an unprecedented 487 individual untrash actions and trying to figure out who has the authority to do that. Bo is walking back to the board prep that they will not, in fact, have on time.
>
> Theo is sitting at their desk. Their coffee is cold. They have not closed any of the eleven browser tabs that were open when they clicked the button. They are not sure if they should.

---

## Hotwash (10–12 minutes after exercise ends)

Run these in order. Capture answers in `forms/gaps-and-findings.md`.

1. At what T+time did your team commit to the call between "kill the running process" and "let it finish"? What information did you wish you'd had three minutes earlier?
2. The audit trail (`purgeResults` JSON) only writes after the loop completes. Is that the right design for a destructive batch operation? What would you change before next Tuesday?
3. Who in your team had the authority to take SecureCatch offline? Was that authority clear *before* you needed it, or did you find out by trying?
4. The kill switch in `7d3f1ac` was a Chekhov's gun left on stage by a teammate. How would you have caught that during code review or pre-prod testing? What does that say about your standard for "feature flag merged" today?
5. If outside counsel had filed their response *before* you produced the sworn timeline, what would you have escalated to whom? Walk through the call.
6. The phisher's choice of Message-ID format is what triggered the AI's normalization collision. Is that a SecureCatch bug, an AI vendor bug, an analyst's bug, or none of those? Where does this kind of issue live on your accountability map?
7. Theo clicked a button that had been clicked 200+ times before with no incident. What changes the next time Theo logs in? What changes for Theo's manager?
8. What surprised you most about how this played out?
9. If you could change one thing about our actual response process based on this exercise, what would it be?
10. Where did time pressure cost us — a decision made too fast, or one we sat on too long?

## Scoring rubric

| Capability | Excellent (3) | Adequate (2) | Needs work (1) | Not exercised (0) |
|------------|---------------|--------------|----------------|-------------------|
| Detection time | < 5 min from inject 1.1 to declared incident | < 10 min | > 10 min, or only after a second signal | n/a — never declared |
| Severity calling | Right severity, justified, on first call | Right severity after one revision | Wrong severity persisted past phase 1 | n/a |
| Containment-vs-evidence trade-off | Stopped further damage AND preserved enough audit trail to defend it later | One but not both, with documented rationale | Stopped damage but lost evidence, or preserved evidence while damage continued, with no rationale | n/a |
| Decision velocity | Calls made inside the time pressure window with documented rationale | Calls made but late, or made without documented rationale | Calls deferred or made by default (clock ran out) | n/a |
| External comms | Customer/regulator/press handled with clarity, no overcommitment, on-time | Handled but rough — overpromise, late, or off-message | Mishandled — wrong audience, wrong message, or blew the clock | n/a |
| Evidence preservation | Forensic-conscious moves throughout (process snapshot, log capture, decision log timestamps) | Evidence preserved retroactively | Evidence lost — process killed without snapshot, logs rotated, decisions undocumented | n/a |
| Legal interface | GC was looped in proactively, sworn-statement deliverable understood and committed to a deadline | GC looped in late but deliverable understood | GC was treated as advisory; sworn-statement requirement misunderstood | n/a |
| Recovery sequencing | Restored in priority order (litigation hold first, then exec, then breadth), with verification before all-clear | Restored mostly correctly, all-clear premature or late | Restoration order created secondary impact, or all-clear was wrong | n/a |

## Appendix A — Facilitator cheatsheet

**Common stalls and how to unblock them:**
- *Team is talking but not deciding about the in-flight purge*: pause, ask the IC directly: "Do we kill the process or not? You have 60 seconds." Phase 1 grinds without that call.
- *Team latched onto "blame Theo"*: redirect immediately. The alert was real; Theo did the right thing. The bug is downstream of the click. If anyone says "well, Theo should have known…" — that *is* a finding for `gaps-and-findings.md`.
- *One person (usually the Eng Lead) is doing all the talking*: address by role. "GC, you have the floor. Talk to me about the discovery clock."
- *Team is reaching for tools (the runbook, the kill switch, the off button) and finding them missing or untested*: that IS the finding. Note it, let the awkwardness sit, and keep moving.
- *Team converges on a clean answer too fast*: drop a wild card — at T+30, a vendor-side Workspace token expiring would be a great extra wrinkle.

**When to drop a wild-card inject:**
- Energy is dropping with 10+ minutes of phase left
- Team has converged too quickly (force a complication — e.g. "the OpenRouter API key just hit its rate limit, the SOC has zero AI assistance")
- Eng-Leadership audiences benefit from one curveball; this one's already busy enough — only drop a wild card if Phase 2 has gone fast.

**How to read the room:**
- *Slow down when*: voices overlap, multiple people are taking notes that disagree, the IC hasn't actually called a decision
- *Push harder when*: long silences, side conversations starting, the same point getting re-litigated
- *Hard stop when*: someone is visibly stressed in a not-productive way (especially the person playing Theo). Pause, name it, give a 2-minute break. The exercise is for learning, not for breaking people.

## Appendix B — Form locations

- Decision log: `forms/decision-log.md`
- Timeline reconstruction: `forms/timeline-reconstruction.md`
- Gaps and findings: `forms/gaps-and-findings.md`
- Attendance and roles: `forms/attendance.md`
- AAR template (for the post-exercise writeup): `forms/aar-template.md`

## Appendix C — Branch trace (facilitator only)

- Inject 1.1 → if team **goes to engineering first**: next is **1.2A** (purge-still-running reveal); if team **triages from helpdesk side**: next is **1.2B** (helpdesk floods, then unprompted eng warning); if **no concrete action in 4 min**: drop **1.2C** (Bo interrupts the bridge)
- Inject 2.1 → if team **moves to recovery in parallel with diagnosis**: next is **2.2A** (TechCrunch DM); if team **stays in diagnosis**: next is **2.2B** (Acme Robotics customer escalation)
- Inject 3.2 → if team **flips the kill switch**: next is **3.3A** (kill switch did nothing); if team **reverts and redeploys**: next is **3.3B** (AI enrichment also lost); if team **takes the product offline (503)**: next is **3.3C** (real phish wave during downtime)
