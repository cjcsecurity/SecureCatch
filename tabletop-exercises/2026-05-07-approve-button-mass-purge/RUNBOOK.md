# Approved & Erased: When the Trash Button Wipes the Boardroom

> **Domain**: prodsec / devops · **Duration**: 30 minutes · **Audience**: eng + leadership · **Difficulty**: intermediate
> Generated 2026-05-07 for SecureCatch (`/home/staycold66/projects/SecureCatch/`)

A 30-minute tabletop on the operational counterpart to last week's prompt-injection exercise: this time the LLM was right, the AI confidence was high, and the analyst still nuked something they shouldn't have. SecureCatch's most dangerous primitive — the domain-wide gmail purge fired by "Approve & Remediate" — just ate a live M&A thread, and the team has half an hour to figure out what happened, what's still at risk, and who tells the CEO.

## Quick reference

| # | Phase | T-window | Key decision | Tested capability |
|---|-------|----------|--------------|-------------------|
| 1 | The Trash Button | T+0 → T+13 | Severity + whether to kill the SecureCatch queue mid-incident | Containment of an in-house tool's blast radius under doubt |
| 2 | What Was In That Thread, Anyway? | T+13 → T+30 | Recover from Vault or admit the loss and re-request the thread | Cross-functional comms (legal, exec, press) under M&A privilege pressure |

## Legend

- 📢 Read-aloud — facilitator says verbatim. Don't paraphrase or skip; the wording is doing work.
- 💉 Inject — revealed at the marked time. Hidden from participants beforehand.
- ⚡ Decision point — team must choose. Document the choice in `forms/decision-log.md`.
- 🌿 Branch — different next-injects depending on the choice. Facilitator picks the matching branch and continues.
- 👤 NPC voice — facilitator (or designated player) plays a role. Voice cues in italics under the line.
- 🎯 Capability tested — what this inject or decision is probing for.

## Scenario summary

It's 11:43 on a Thursday at SnapDocs. Maya, the SOC analyst on rotation, has been chewing through the SECOPS Jira queue all morning. SecureCatch — the in-house phishing-triage SOAR your team shipped to prod three weeks ago — has been a quiet win. AI confidence has been steady in the high 80s. VirusTotal hits have lined up. The "Approve & Remediate" button has been working exactly as designed: one click, and the offending email is yanked from every inbox in the org via the service account's `gmail.modify` scope.

At 11:43:07, Maya clicks Approve on alert `SC-2104`. The AI summary calls it a "high-confidence Business Email Compromise (BEC) attempt impersonating outside counsel — sender domain `bigfishlegal.example` is suspicious, attached PDF references wire transfer instructions, urgency cues consistent with payment fraud." VirusTotal returned 7 of 89 engines flagging the linked URL. Confidence: 94%. Standard pattern.

At 11:46, the CEO's executive assistant pages the IT shared inbox: a thread from outside counsel — Reece Park at Bigfish Legal — has vanished from the CEO's inbox. The CEO is on a call with the bank. The thread contained the definitive agreement and wire instructions for the acquisition that closes Friday. Two minutes later, the CFO IMs the head of security: *"Where did the wire instructions go? I had them right here."* By 11:48 the head of security, Aria, has typed "did SecureCatch eat a real email" into your incident channel and hit enter.

The deal closes in 22 hours. Outside counsel is in transit and hard to reach. Four more alerts are queued in SecureCatch waiting for review. The next analyst to click Approve is doing it in roughly five minutes. Nobody has touched the runbook for "we built a thing that can do this and it just did" because nobody seriously believed they'd need to.

## Roles & responsibilities

| Role | Played by | Owns |
|------|-----------|------|
| Facilitator | _________ | Pacing, injects, timekeeping, calling branches |
| Evaluator (optional) | _________ | Notes, decision capture, hotwash prompts |
| Incident Commander | _________ | Declares severity, runs the room, owns the all-clear call |
| Security Lead (Aria) | _________ | Containment of SecureCatch's blast radius; classifies sensitivity of what was lost |
| Engineering Lead | _________ | The actual code path: was it `trash` or `batchDelete`; pauses the queue |
| Comms / People Ops Lead | _________ | Internal register and who tells the CEO; press posture |
| Legal / Privacy Lead | _________ | M&A privilege exposure (incl. via OpenRouter); recovery posture; outside counsel coordination |

> **Note for the facilitator**: every named role above owns at least one decision in this runbook. If a role is absent, the facilitator covers their decision but flags it as a gap in `forms/gaps-and-findings.md`.

## Pre-exercise setup (T-pre)

- [ ] Send `PARTICIPANT-PACKET.md` to attendees ≥ 24 hours before
- [ ] Confirm role assignments (use `forms/attendance.md`)
- [ ] Print or pull up `forms/decision-log.md` and `forms/timeline-reconstruction.md`
- [ ] Read through `INJECTS.md` once end-to-end so you can see the branches before you have to call them
- [ ] Have the SecureCatch repo open in a browser tab — participants will likely ask to "look at the code" for `app/api/remediate/[id]/route.ts` and `lib/google.ts`. Decide in advance whether you'll allow it (recommended: yes, briefly, but don't let it become a code review)
- [ ] Stage two screenshots in case the team asks: a fake SecureCatch alert detail page for `SC-2104` showing 94% confidence, and a fake Google Workspace audit-log row showing `users.messages.batchDelete` (these are in the repo's `tabletop-exercises/` folder if pre-staged, or the facilitator can describe them verbally)

---

## Phase 1 — The Trash Button (T+0 to T+13)

### 📢 Read-aloud opener

> It's 11:48 on a Thursday and your incident channel just woke up. Aria, head of security: *"did SecureCatch eat a real email."* No question mark. Below that, Maya — your SOC analyst — pasted a screenshot: alert `SC-2104`, AI confidence 94%, "Approved & Remediated" 11:43:07. Above that, the CEO's executive assistant in the IT shared inbox: "the thread from Reece Park at Bigfish Legal is gone from the CEO's inbox, she is on a call with the bank in twelve minutes and needs the wire details." The CFO's DM lands a beat later: where did the wire instructions go. The Friday close on the acquisition is twenty-two hours out. The runbook for "the SOAR did the thing it's designed to do, but to the wrong email" does not exist. You have until somebody else clicks Approve on the next alert to figure out whether and how to stop the queue.

### 🎯 Capabilities tested in this phase

- **Detection-to-declaration speed** for an incident caused by your *own* tooling (no external attacker, no malware — just a confident click)
- **Containment instinct** when the dangerous primitive lives in a system you built and is still running
- **Severity calling** in a context where the immediate impact is small (one thread, one CEO) but the trajectory is wide (M&A privilege, audit, customer trust if this product ever ships externally)

### 💉 Inject 1.1 — The audit log says it wasn't `trash` (T+2)

> **From: Engineering Lead, in #securecatch-incident:**
>
> "Pulled the Workspace audit log. SecureCatch called `users.messages.batchDelete` — that's *permanent delete*, not Trash. 1,847 message IDs, 412 mailboxes. The thread isn't in anyone's Trash folder. The IDs were resolved by a thread-match query, so it grabbed every reply, every forward, every CC's copy. Reece Park, the CEO, the CFO, the GC, the corp-dev VP — all gone. Vault retention is 25 days so a copy still exists in Vault, but pulling it out is a manual export."
>
> "Also: there are four more alerts in the SecureCatch queue right now. Maya is at lunch. The next analyst on rotation is Jordan, who I think clicks Approve fast."

**🌿 Branch on team's response within 3 minutes:**
- If team **declares an incident** (any severity) and **explicitly pauses the SecureCatch queue or the Approve action** → proceed to **Inject 1.2A**
- If team starts **investigating without pausing the queue** → proceed to **Inject 1.2B**
- If team takes neither action by T+5 → drop **Inject 1.2C** (the wild card — Jordan clicks Approve on a different alert)

### 💉 Inject 1.2A — Queue paused; CFO is escalating (T+5)

> **From: Comms Lead, in #securecatch-incident:**
>
> "Queue is paused — engineering put up an interstitial that 'Approve & Remediate' is disabled pending review. Good. Less good: the CFO just looped in the COO and the head of M&A. They want to know in fifteen minutes whether the wire instructions are recoverable. They're asking by name for the SecureCatch on-call, which is awkward because that's a rotation we set up but never publicized."
>
> Aria, on a separate thread: *"who tells the CEO. she gets off the bank call in nine minutes."*

### 💉 Inject 1.2B — Queue still live; Jordan just clicked Approve (T+5)

> **From: Engineering Lead, in #securecatch-incident:**
>
> "While we were talking, Jordan approved `SC-2105`. That one looked like a real phish — DocuSign impersonator, 6 of 89 on VirusTotal, 91% AI confidence. Probably actually malicious. But now we don't know if 'probably' is enough, and we don't have a way to retroactively check what we just deleted from the org. Also: the CFO just looped in the COO and the head of M&A asking by name for the SecureCatch on-call."
>
> Aria, on a separate thread: *"who tells the CEO. she gets off the bank call in nine minutes. and we still don't know if there are more SC-2104s in the queue."*

### 💉 Inject 1.2C — Wild card: Jordan approved a third alert (T+7)

> **From: Engineering Lead, in #securecatch-incident:**
>
> "Two more deletes fired. `SC-2105` (probably real DocuSign phish) and `SC-2106` (looks like a Slack notification, but the AI tagged it as a phishing lure). 1,847 + 1,103 + 47 deletions across the org. We have no triage capacity if more real threats come in, AND we have no idea what we just deleted that wasn't a threat. The CFO is also DM'ing me directly now."

**🎯 Capability tested**: The team that gets here either ignored the queue or didn't have a clear "stop the world" lever. That IS the finding. Note in `forms/gaps-and-findings.md`.

### ⚡ Decision point 1 — Severity declaration and queue posture

**The choice**: Declare a severity and decide what happens to the SecureCatch queue for the next 24 hours.
- **Option A** — SEV-1, kill the SecureCatch queue entirely until a human-in-the-loop redesign ships. Cost: phishing alerts pile up; a real attack today goes unhandled longer.
- **Option B** — SEV-2, pause `Approve & Remediate` only but allow analysts to keep classifying. Cost: implies the tool is fine if you just don't click the button — engineering may not feel the urgency.
- **Option C** — SEV-3, treat as a single-message false positive, push a rule to require two-analyst approval for messages from `*@bigfishlegal.example` (or any external counsel domain). Cost: solves this case, ignores the class.

**Owns this call**: Incident Commander, with input from Security Lead and Engineering Lead.

**Document in decision log**: who made the call, T+time, the rationale, and explicitly: what's the *trigger* for re-enabling the queue? (If the team can't name a concrete trigger, that's a finding.)

---

## Phase 2 — What Was In That Thread, Anyway? (T+13 to T+30)

### 📢 Read-aloud bridge

> It's 12:01. The SecureCatch queue is paused (or it isn't, and somebody is still typing in the eng channel). The CEO has nine more minutes on the bank call. Reece Park is unreachable; their assistant returned a "in transit, available after 14:00" auto-reply. The corp-dev lead — Priya Banerjee — just dropped into the channel: *"I had four threads with Reece in the last week. The other three were all attorney-client privileged. Did SecureCatch send the body of any of those to OpenRouter?"* The Engineering Lead is now reading `lib/ai.ts` very carefully.

### 🎯 Capabilities tested in this phase

- **Cross-functional comms under privilege pressure** — legal, exec, and press all want different framings on different clocks
- **Recovery decisioning** when the recovery option (Vault export) is technically possible but slow and visibly auditable, and the alternative (re-request) is fast but admits the loss
- **Vendor / data-flow awareness** — does the team know whether the email body actually went to OpenRouter? (It does, per `lib/ai.ts`.) Whose problem is that, and is it disclosable?

### 💉 Inject 2.1 — 👤 NPC voice — Priya Banerjee (Head of Corp Dev) (T+14)

> Priya joins the call rather than typing. *"I'm not yelling yet. Tell me — when SecureCatch flagged this email, did it send the *contents* of the email to OpenRouter? Because if so we just disclosed a draft definitive agreement to a third-party LLM provider, plus three other privileged threads from Reece this week if those got triaged the same way. That is a meaningful problem for legal even if we recover the email. I need a yes or no in five minutes, and I need to know what the contract with OpenRouter says about retention."*
>
> *deliveed flat, no inflection, the voice of someone who has had to make an M&A counterparty unhappy before*

**🌿 Branch on what the Engineering Lead reports:**
- If the team **reads the code** and confirms the body goes to OpenRouter (it does — `lib/ai.ts` ships the email body to the model), → proceed to **Inject 2.2A** (the disclosure question is real)
- If the team **assumes the body doesn't go** without checking, the facilitator drops a quiet "actually, you should look" hint and forces the check before continuing. The fact that this took prompting is a finding.

**Where Priya pushes**: legal-clock pressure, but also a reframe — the deleted email is the visible incident; the LLM disclosure is the bigger one. If the team only solves the visible problem, Priya will say so in the hotwash.

### 💉 Inject 2.2A — Recovery options, with their costs (T+18)

> **From: Engineering Lead, in #securecatch-incident:**
>
> "Vault has the thread. To export it: open Vault → matter → search by participant + date range → export → wait 30-90 minutes for the export to build → download the MBOX → re-import to the affected mailboxes (manually, or via a Workspace Migrate flow). Realistically four to six hours, and it leaves a Vault audit trail visible to anyone with Vault access — including audit and compliance.
>
> Alternative: just ask Reece's office to resend the thread. Faster (an hour, max), but means we tell Reece — and through Reece, Bigfish Legal — that we lost the thread."
>
> "Either way: the CEO needs the wire details *now*, not in four hours. We can pull just the wire-instruction PDF from Vault as a fast path — that's maybe forty minutes — and recover the rest of the thread on a slower clock."

### 💉 Inject 2.3 — 👤 NPC voice — Trade-press DM (T+22)

> The CISO's phone buzzes. A DM from Sasha Wren at TechCrunch, who has covered SnapDocs before:
>
> *"Hey — hearing you have an internal AI tool that auto-deletes emails and it just nuked some legal correspondence. Any comment? I'm filing this afternoon either way."*
>
> *terse, professional, not hostile but not your friend either*

**Where Sasha pushes**: external-comms clock. If the team has paused the queue and recovered cleanly, the story is small. If the queue was still running or the M&A counterparty was told before the team got ahead of it, the story has more shape.

**🌿 Branch on Phase 1 outcome:**
- If team **paused the queue in Phase 1 and is mid-recovery** → Sasha's tip is thin; team can choose silence, on-record, or on-background
- If team **didn't pause the queue** OR Phase 1 ended with three approves having fired → Sasha already has a second source (a hypothetical employee who saw their inbox shrink) and is filing whether or not the team responds

### ⚡ Decision point 2 — Recovery posture and who tells whom, in what order

**The choice** has three coupled parts:
1. **Recovery**: Vault export (slow, internal-only audit trail) vs. ask Reece to re-send (fast, external admission of loss)
2. **CEO comms**: who tells her, what register, before or after she's off the bank call
3. **Press posture**: respond to Sasha on-record, on-background, or no comment — and is the answer the same if the queue wasn't paused?

**Owns this call**:
- Recovery: Legal Lead with Engineering Lead
- CEO comms: Comms Lead with Incident Commander
- Press: CISO (covered by Security Lead in this exercise) with Comms Lead

**Document in decision log**: each of the three sub-decisions, with explicit rationale. The team doesn't have to make all three at the same instant, but they do have to make them all by T+27.

### 📢 Closing read-aloud (T+28)

> It's 12:18. Choose your ending. In one version, the CEO got the wire-instruction PDF at 12:14 from a fast Vault pull, did her bank call, and now wants a meeting at 14:00 with the IC, the head of security, and the engineer who shipped `Approve & Remediate`. The recovery of the rest of the thread is on a four-hour clock. Sasha's story is two paragraphs and a "did not respond to a request for comment." Priya is still angry about the LLM disclosure but is willing to wait until 14:00 to say so. In another version, Jordan clicked Approve on three more alerts during your meeting, two of which were real phish, one of which was the corporate development team's own internal NDA tracker — and the conversation in the 14:00 meeting is going to be different. Both versions get an AAR. Both versions have things to fix. The exercise ends here; the AAR work starts when you turn off the timer.

> **For the facilitator**: do not narrate which ending the team got. Let them feel which one their decisions earned, and let the hotwash surface it.

---

## Hotwash (15-20 minutes after exercise ends)

Run these in order. Capture answers in `forms/gaps-and-findings.md`.

1. When did this become an "incident" in your heads — at the EA's call, the audit log, the CFO's DM, or only when Priya named the LLM disclosure? What was the signal that flipped it for *you*, specifically?
2. The dangerous primitive — domain-wide `batchDelete` from a single click — was something you built. What was the safety-review conversation that should have happened *before* this code shipped? Did it happen?
3. What's the right human-in-the-loop design for `Approve & Remediate`? Two-analyst approval? A scope cap (e.g., never delete from more than N mailboxes without escalation)? A scoped-trash mode that's recoverable? Something else? Be specific.
4. If the team paused the queue: what was your trigger to *un*pause it, and is that trigger objective enough that someone else could apply it without you in the room?
5. The LLM-disclosure question (Priya's reframe) — would you have surfaced that on your own if she hadn't named it? What does that tell you about your tool-inventory and data-flow knowledge?
6. Vault export vs. re-request: if the deal hadn't been twenty-two hours away, would you have made the same recovery choice? How does deadline pressure distort recovery decisions in general?
7. Tell-the-CEO ordering: who actually owns "tell the CEO" in your real org, on a Thursday at noon, with no warning? Was the answer in the room or did you have to invent it?
8. What surprised you most about how this played out?
9. If you could change one thing about our actual response process based on this exercise, what would it be?
10. Where did time pressure cost us — a decision made too fast, or one we sat on too long?

---

## Appendix A — Facilitator cheatsheet

**Common stalls and how to unblock them:**

- _Team is talking but not deciding_: pause, ask "what's the next concrete action and who owns it" — do not let abstract discussion stretch past 4 minutes. With 30 minutes total, two minutes of indecision is 7% of the exercise.
- _Team latched onto "we'll just restore from Vault"_: drop Inject 2.1 (Priya's LLM disclosure question) early. Tunneling on the recovery path lets them miss the harder problem.
- _Engineering Lead is doing all the work_: this scenario tempts the eng to drive everything because the bug lives in their code. Address by role: "Comms Lead — what's the message to the CEO right now? You have four minutes."
- _Team can't find / doesn't know what scope `gmail.modify` actually allows_: that IS the finding. Note it in `forms/gaps-and-findings.md` and let the awkwardness sit.

**When to drop a wild-card inject:**

- Energy is dropping and there are 8+ minutes of phase left
- Team has converged too quickly on a tidy answer in Phase 1 (drop 1.2C — Jordan kept clicking)
- Team is treating this as a small problem (drop a "the corp-dev NDA tracker was also flagged in the queue and Jordan just approved that too" curveball)

**How to read the room:**

- _Slow down when_: voices overlap, multiple people are taking notes that disagree, someone with authority hasn't spoken in 5+ minutes
- _Push harder when_: long silences, side conversations starting, the same point getting re-litigated
- _Hard stop when_: someone is visibly stressed in a not-productive way. Pause, name it, give a 2-minute break.

**Specific "gotcha" facts the facilitator should hold:**

- `lib/ai.ts` does send the email body to OpenRouter. Confirm by Reading the file before the exercise.
- `app/api/remediate/[id]/route.ts` calls into `lib/google.ts`, which uses Gmail's modify scope. Whether the actual code path uses `users.messages.trash` (recoverable) or `users.messages.batchDelete` (permanent) is a *design question* the facilitator can keep open — the runbook assumes `batchDelete` for dramatic stakes; if the actual code uses `trash`, that itself is a real-world detail the team should surface and the facilitator should reward.
- The bearer-token check in `lib/auth/api-token.ts` is not relevant to this scenario. If the team goes there, gently steer back.

---

## Appendix B — Form locations

- Decision log: `forms/decision-log.md`
- Timeline reconstruction: `forms/timeline-reconstruction.md`
- Gaps and findings: `forms/gaps-and-findings.md`
- Attendance and roles: `forms/attendance.md`
- AAR template (for the post-exercise writeup): `forms/aar-template.md`

---

## Appendix C — Branch trace (facilitator only)

- Inject 1.1 → if team declares + pauses queue: next is **1.2A**; if team investigates without pausing: next is **1.2B**; if no action by T+5: drop **1.2C** (Jordan clicks Approve again).
- Inject 2.1 → if team confirms the LLM call by reading `lib/ai.ts`: next is **2.2A** (the disclosure question is real); if team assumes without checking: facilitator hint, then 2.2A. The check-or-not behavior is itself a hotwash datum.
- Inject 2.3 → if Phase 1 ended with queue paused and clean recovery in motion: Sasha has a thin tip; team's choice of register matters but stakes are low. If Phase 1 ended with the queue still running or three approves having fired: Sasha has a second source and the press story is harder to shape.

The two trajectory-changing branches are: (1) Phase 1's queue-pause decision, which materially changes Phase 2's press inject; (2) Phase 2.1's check-the-code-or-not behavior, which determines whether the team surfaces the LLM disclosure on their own (and whether Priya's hotwash framing is "yes, and we found it" vs. "you didn't until I told you").
