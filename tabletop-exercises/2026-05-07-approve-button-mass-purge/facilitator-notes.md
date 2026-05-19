# Facilitator notes — Approved & Erased

## Pre-exercise checklist (T-pre)

### 24+ hours before

- [ ] Send `PARTICIPANT-PACKET.md` to attendees
- [ ] Confirm role assignments via `forms/attendance.md` — at minimum you need:
  - 1× Incident Commander
  - 1× Security Lead
  - 1× Engineering Lead
  - 1× Comms / People Ops Lead
  - 1× Legal / Privacy Lead
- [ ] Confirm the room / video link / shared workspace where the exercise will happen
- [ ] Identify the Evaluator (can be you, but having a separate one is better)
- [ ] Pre-read `RUNBOOK.md` end-to-end at least once

### Day of, ≥ 30 min before

- [ ] Re-read `INJECTS.md` cover to cover. The branches are tight; you want them in working memory, not on a re-read.
- [ ] Have these tabs / windows open and ready:
  - `RUNBOOK.md` — your authoritative source
  - `INJECTS.md` — fast reference for inject text
  - `forms/decision-log.md` — for the Evaluator
  - `forms/timeline-reconstruction.md` — for the Evaluator
  - The SecureCatch repo, specifically:
    - `lib/ai.ts` (so you can confirm to the team that the email body goes to OpenRouter — this is a real fact, not a stage prop)
    - `app/api/remediate/[id]/route.ts` and `lib/google.ts` (so you can answer "what does the code actually do" without scrambling)
- [ ] Print or pin in chat: the inject pacing table from the bottom of `INJECTS.md`
- [ ] Set a timer. The 30 minutes is *strict*. If you don't have a visible countdown, the team will lose the time-pressure feel that's the whole point.

## Materials list

- Visible countdown timer (whiteboard, phone in landscape, or a tab with a 30-min timer)
- Paper or shared doc for the decision log (Evaluator)
- Paper or shared doc for the timeline reconstruction (Evaluator)
- Optional but recommended: a fake screenshot of a SecureCatch alert detail view for `SC-2104` showing 94% AI confidence, the "Approve & Remediate" button, and the email subject "Re: Definitive Agreement v3 — wire instructions attached." If you don't have time to mock this, describing it verbally works fine.
- Optional: a fake Google Workspace audit-log row showing `users.messages.batchDelete` against 1,847 message IDs from the SecureCatch service account.

## Pre-brief (give to the room at T-2 minutes, before starting the timer)

Roughly verbatim:

> "Quick frame. This is a 30-minute tabletop on SecureCatch — the SOAR we shipped three weeks ago. Different exercise from the prompt-injection one earlier today. This one is about what happens when the tool does exactly what it was built to do, on the wrong target.
>
> Ground rules: no 'well actually we'd just call X' unless X is a real person who is reachable in the next 30 minutes. Decisions get logged with timestamps and rationales. You can call a 60-second pause if you need to think; you can't call a five-minute pause. The clock keeps moving.
>
> Maya is a real person on the team and the exercise opens with her clicking Approve on the wrong thing. The point of this is the *system* that let her click that button so confidently, not Maya. Talk that way.
>
> I'm starting the timer at T+0 in about thirty seconds. Roles: [read out the role assignments]. First read-aloud is right at T+0. Anyone need anything before we go."

## Pacing — the things that will go wrong

### The team gets stuck on "what does the code actually do?"

The exercise leans into ambiguity about whether SecureCatch uses `users.messages.trash` (recoverable) or `users.messages.batchDelete` (permanent). The runbook treats it as `batchDelete` for stakes. If a participant says "let me look at the actual code"... let them, briefly. Cap it at 90 seconds. Then say: "for purposes of this exercise, treat the actual code path as `batchDelete`. The fact that we have ambiguity here is a finding — note it." Then move on.

### The Engineering Lead drives everything

This scenario tempts the eng lead to take over because the bug is in their code. Push back:

- "Comms Lead — what is the message to the CEO right now? You have four minutes. Eng Lead, hold."
- "Legal Lead — what does our contract with OpenRouter say about retention. If you don't know, that's a finding; say it and move on."

### Tunneling on the recovery path

If the team converges fast on "we'll just restore from Vault and tell the CEO it's fine," drop Inject 2.1 (Priya) **early** — at T+12 instead of T+14. Her question reframes the incident from "we deleted an email" to "we shipped privileged email content to a third-party LLM." Don't let them duck it.

### Slow start

If the team is still chatting at T+3 and hasn't named a severity, drop a synthetic prompt: "Aria just typed in the channel: *what severity is this. someone call it.*" Force the call.

### Fast finish

If the team is at "all-clear" by T+22 with eight minutes to spare, do not let them coast. Drop a wild-card: *"Just to make sure we're tracking — Jordan messaged me to say SC-2107 in the queue is from Bigfish Legal too. Do we have any process to flag that for two-analyst review or do we just trust the pause?"* That puts the durability of their fix under pressure.

## What success looks like

A successful run produces, in `forms/`:
- A decision log with at least 4 timestamped entries: severity call, queue posture, recovery posture, CEO comms ordering
- A gaps-and-findings file with at least 3 specific findings, ideally including:
  - A design gap on `Approve & Remediate` (no human-in-the-loop, no scope cap, no two-analyst rule)
  - A data-flow gap (the team didn't know offhand what SecureCatch sends to OpenRouter)
  - A comms-ordering gap (no clear "who tells the CEO" path)
- A timeline that maps the team's calls to the inject times — useful for the AAR

A successful run does **not** require the team to "solve" anything. The deliverable is the surfaced gap, not the resolved incident.

## After

- Run hotwash immediately, while the room is still in the headspace. 15-20 minutes. Use the questions in `RUNBOOK.md` § Hotwash.
- Within a week, run `/tabletop-aar` (the After-Action Report skill) against this exercise directory to draft the AAR. Assign owners + dates to every action item.
- Compare gaps with the prior `2026-05-07-poisoned-phish` exercise. If the same gap shows up in both — that's a higher-priority systemic issue.
