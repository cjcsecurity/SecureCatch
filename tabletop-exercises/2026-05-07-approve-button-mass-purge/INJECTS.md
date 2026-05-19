# Injects — Approved & Erased

> Standalone deck for fast facilitator reference during the exercise. Pull this up on a phone or tablet so you can drop injects without scrolling through `RUNBOOK.md` mid-flow. Each inject below is the literal text to drop into the channel, plus the branch logic.

---

## T+0 — Read-aloud opener (Phase 1)

> It's 11:48 on a Thursday and your incident channel just woke up. Aria, head of security: *"did SecureCatch eat a real email."* No question mark. Below that, Maya — your SOC analyst — pasted a screenshot: alert `SC-2104`, AI confidence 94%, "Approved & Remediated" 11:43:07. Above that, the CEO's executive assistant in the IT shared inbox: "the thread from Reece Park at Bigfish Legal is gone from the CEO's inbox, she is on a call with the bank in twelve minutes and needs the wire details." The CFO's DM lands a beat later: where did the wire instructions go. The Friday close on the acquisition is twenty-two hours out. The runbook for "the SOAR did the thing it's designed to do, but to the wrong email" does not exist. You have until somebody else clicks Approve on the next alert to figure out whether and how to stop the queue.

---

## T+2 — 💉 Inject 1.1 — The audit log says it wasn't `trash`

**Drop in #securecatch-incident, voiced as Engineering Lead:**

> "Pulled the Workspace audit log. SecureCatch called `users.messages.batchDelete` — that's *permanent delete*, not Trash. 1,847 message IDs, 412 mailboxes. The thread isn't in anyone's Trash folder. The IDs were resolved by a thread-match query, so it grabbed every reply, every forward, every CC's copy. Reece Park, the CEO, the CFO, the GC, the corp-dev VP — all gone. Vault retention is 25 days so a copy still exists in Vault, but pulling it out is a manual export."
>
> "Also: there are four more alerts in the SecureCatch queue right now. Maya is at lunch. The next analyst on rotation is Jordan, who I think clicks Approve fast."

**🌿 Branch (3-minute window):**
- Team **declares incident + pauses queue / Approve action** → drop **1.2A** at T+5
- Team **investigates without pausing** → drop **1.2B** at T+5
- Team **takes neither action by T+5** → drop **1.2C** at T+7

---

## T+5 — 💉 Inject 1.2A (queue paused branch)

**Drop in #securecatch-incident, voiced as Comms Lead:**

> "Queue is paused — engineering put up an interstitial that 'Approve & Remediate' is disabled pending review. Good. Less good: the CFO just looped in the COO and the head of M&A. They want to know in fifteen minutes whether the wire instructions are recoverable. They're asking by name for the SecureCatch on-call, which is awkward because that's a rotation we set up but never publicized."

**Then, on a separate thread, voiced as Aria:**

> *"who tells the CEO. she gets off the bank call in nine minutes."*

---

## T+5 — 💉 Inject 1.2B (queue still live branch)

**Drop in #securecatch-incident, voiced as Engineering Lead:**

> "While we were talking, Jordan approved `SC-2105`. That one looked like a real phish — DocuSign impersonator, 6 of 89 on VirusTotal, 91% AI confidence. Probably actually malicious. But now we don't know if 'probably' is enough, and we don't have a way to retroactively check what we just deleted from the org. Also: the CFO just looped in the COO and the head of M&A asking by name for the SecureCatch on-call."

**Then, on a separate thread, voiced as Aria:**

> *"who tells the CEO. she gets off the bank call in nine minutes. and we still don't know if there are more SC-2104s in the queue."*

---

## T+7 — 💉 Inject 1.2C — Wild card (no-action branch)

**Drop in #securecatch-incident, voiced as Engineering Lead:**

> "Two more deletes fired. `SC-2105` (probably real DocuSign phish) and `SC-2106` (looks like a Slack notification, but the AI tagged it as a phishing lure). 1,847 + 1,103 + 47 deletions across the org. We have no triage capacity if more real threats come in, AND we have no idea what we just deleted that wasn't a threat. The CFO is also DM'ing me directly now."

> **Facilitator note**: this branch IS the finding. Note in `forms/gaps-and-findings.md`: "team did not have a clear stop-the-world lever for SecureCatch."

---

## T+8 — ⚡ Decision point 1 — Severity + queue posture

**Force the call. The team must answer all three:**

1. What severity? (SEV-1 / SEV-2 / SEV-3)
2. What happens to the queue for the next 24 hours? (Kill / pause-Approve-only / continue with extra checks)
3. What's the **trigger** for re-enabling Approve? (If they can't name a concrete trigger, log as a gap.)

**Owner**: Incident Commander, with input from Security Lead and Engineering Lead.

**Capture in `forms/decision-log.md`**: name, T+time, rationale, who else was in the loop.

---

## T+13 — Read-aloud bridge (Phase 2)

> It's 12:01. The SecureCatch queue is paused (or it isn't, and somebody is still typing in the eng channel). The CEO has nine more minutes on the bank call. Reece Park is unreachable; their assistant returned a "in transit, available after 14:00" auto-reply. The corp-dev lead — Priya Banerjee — just dropped into the channel: *"I had four threads with Reece in the last week. The other three were all attorney-client privileged. Did SecureCatch send the body of any of those to OpenRouter?"* The Engineering Lead is now reading `lib/ai.ts` very carefully.

---

## T+14 — 💉 Inject 2.1 — 👤 Priya Banerjee (Head of Corp Dev)

**Voiced live by facilitator or designated player. Priya joins the call rather than typing:**

> *"I'm not yelling yet. Tell me — when SecureCatch flagged this email, did it send the contents of the email to OpenRouter? Because if so we just disclosed a draft definitive agreement to a third-party LLM provider, plus three other privileged threads from Reece this week if those got triaged the same way. That is a meaningful problem for legal even if we recover the email. I need a yes or no in five minutes, and I need to know what the contract with OpenRouter says about retention."*
>
> *delivered flat, no inflection, the voice of someone who has had to make an M&A counterparty unhappy before*

**🌿 Branch:**
- Team **reads `lib/ai.ts` and confirms the body goes to OpenRouter** → proceed to 2.2A
- Team **assumes without checking** → facilitator nudges: "you should probably look at the code." Note the prompted-vs-volunteered behavior in `forms/gaps-and-findings.md`. Then proceed to 2.2A.

---

## T+18 — 💉 Inject 2.2A — Recovery options, with their costs

**Drop in #securecatch-incident, voiced as Engineering Lead:**

> "Vault has the thread. To export it: open Vault → matter → search by participant + date range → export → wait 30-90 minutes for the export to build → download the MBOX → re-import to the affected mailboxes (manually, or via a Workspace Migrate flow). Realistically four to six hours, and it leaves a Vault audit trail visible to anyone with Vault access — including audit and compliance.
>
> Alternative: just ask Reece's office to resend the thread. Faster (an hour, max), but means we tell Reece — and through Reece, Bigfish Legal — that we lost the thread."
>
> "Either way: the CEO needs the wire details *now*, not in four hours. We can pull just the wire-instruction PDF from Vault as a fast path — that's maybe forty minutes — and recover the rest of the thread on a slower clock."

---

## T+22 — 💉 Inject 2.3 — 👤 Trade-press DM (Sasha Wren, TechCrunch)

**The CISO (or Security Lead, in their absence) reads from their phone:**

> *"Hey — hearing you have an internal AI tool that auto-deletes emails and it just nuked some legal correspondence. Any comment? I'm filing this afternoon either way."*
>
> *terse, professional, not hostile but not your friend either*

**🌿 Branch on Phase 1 outcome:**
- **Phase 1 ended with queue paused, recovery in motion**: Sasha's tip is thin. Team has room to choose silence, on-record, or on-background. The story will be small.
- **Phase 1 ended with queue still running OR three approves having fired**: Sasha has a second source already (a hypothetical employee who watched their inbox shrink). She is filing whether the team responds or not.

---

## T+25 — ⚡ Decision point 2 — Recovery + comms ordering

**Force three coupled calls. Team must commit by T+27:**

1. **Recovery**: Vault export (slow, audit-visible, internal-only) vs. ask Reece to re-send (fast, external admission)
2. **CEO comms**: who tells her, in what register, before or after she's off the bank call
3. **Press posture**: respond to Sasha on-record, on-background, or no comment — and would the answer be the same if Phase 1 had gone differently?

**Owners**:
- Recovery: Legal Lead with Engineering Lead
- CEO comms: Comms Lead with Incident Commander
- Press: Security Lead (acting CISO) with Comms Lead

**Capture each sub-decision separately in `forms/decision-log.md`** with rationale.

---

## T+28 — 📢 Closing read-aloud

> It's 12:18. Choose your ending. In one version, the CEO got the wire-instruction PDF at 12:14 from a fast Vault pull, did her bank call, and now wants a meeting at 14:00 with the IC, the head of security, and the engineer who shipped `Approve & Remediate`. The recovery of the rest of the thread is on a four-hour clock. Sasha's story is two paragraphs and a "did not respond to a request for comment." Priya is still angry about the LLM disclosure but is willing to wait until 14:00 to say so. In another version, Jordan clicked Approve on three more alerts during your meeting, two of which were real phish, one of which was the corporate development team's own internal NDA tracker — and the conversation in the 14:00 meeting is going to be different. Both versions get an AAR. Both versions have things to fix. The exercise ends here; the AAR work starts when you turn off the timer.

> **Facilitator**: do not narrate which ending the team got. Let them feel which one their decisions earned, and let the hotwash surface it.

---

## Inject pacing reference

| T+ | Inject | Type | Owner action |
|----|--------|------|--------------|
| 0 | Opener | 📢 Read-aloud | Facilitator reads verbatim |
| 2 | 1.1 | 💉 + 🌿 | Drop, watch for branch within 3 min |
| 5 | 1.2A or 1.2B | 💉 | Drop based on Phase 1 branch |
| 7 | 1.2C | 💉 wild card | Only if no-action by T+5 |
| 8 | Decision 1 | ⚡ | Force severity + queue call |
| 13 | Bridge | 📢 Read-aloud | Facilitator reads verbatim |
| 14 | 2.1 (Priya) | 💉 + 👤 + 🌿 | Live NPC; check-or-not branch |
| 18 | 2.2A | 💉 | Recovery options |
| 22 | 2.3 (Sasha) | 💉 + 👤 + 🌿 | Press DM; branches on Phase 1 |
| 25 | Decision 2 | ⚡ | Force recovery + comms calls |
| 28 | Close | 📢 Read-aloud | Facilitator reads verbatim |
