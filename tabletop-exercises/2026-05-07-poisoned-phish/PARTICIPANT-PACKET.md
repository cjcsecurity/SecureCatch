# Poisoned Phish: When the Email Triages the Triage Tool

> **A 90-minute prompt-injection tabletop for SecureCatch's pre-launch team**
> **Date**: Tuesday 2026-05-07 · **Duration**: 90 minutes · **Audience**: eng + leadership · **Difficulty**: intermediate
> **Domain**: ai-safety

This is the pre-read for participants. Read it before walking in. **Do not skim ahead** to the runbook, the inject deck, or any of the forms — those are the facilitator's tools and seeing them first will spoil the exercise for you and weaken the value for everyone in the room.

## What this exercise is

A live, scripted incident drill. The facilitator drops "injects" — pieces of information arriving in Slack, email, or the database — at timed intervals. The team responds in real time, makes decisions out loud, and a scribe captures it. There are four phases over 90 minutes. We end with a 15-minute hotwash, then everyone goes home and an AAR is drafted within 24 hours.

This is **not** a quiz. There are no "right answers" hidden behind the inject deck. Every meaningful decision in this exercise is a tradeoff with a real cost on both sides. The goal is to surface how *we* — this specific 3-person team, with this specific stack, on this specific Tuesday — actually move under pressure when the AI is the attack surface.

## Scenario summary

It's Tuesday 14:47 in early May 2026. SecureCatch — your phishing-triage SOAR — has been live with one beta customer, **Grayline** (a 200-person SaaS in Denver), for three weeks. Their SOC routes about thirty phishing reports a day from Jira SECOPS into your `/api/ingest` endpoint. Most are spam. The AI classifier (`anthropic/claude-3.5-sonnet` via OpenRouter) catches the rest. Last Friday Grayline's CISO told you SecureCatch had cut their analyst's average triage time from twelve minutes per ticket to ninety seconds. You were planning to use the quote in a pitch deck.

A screenshot lands in your founder Slack. It's from one of Grayline's analysts, **Maya**. The screenshot shows a SecureCatch alert page: classification `Safe`, confidence `95`. The email subject is `Mandatory: re-verify your Office 365 SSO before EOD`. The link is `office365-sso-validator[.]net`. Maya's caption: *"is this what it's supposed to do?"*

The next ninety minutes test what your team does when the input the AI is reading turns out to be talking *to* the AI — and you have to figure out, in real time, how deep the manipulation goes, what your one paying customer needs to hear, and what you ship before tomorrow morning.

## Objectives

1. **Detect AI-output manipulation** when the manipulated artifact looks internally consistent.
2. **Scope the blast radius** across past alerts using the data you actually have.
3. **Make a customer-trust call** with a small founding team and incomplete information, on someone else's clock.
4. **Produce a same-day mitigation plan** with honest tradeoffs — not the plan that sells best, the plan you'd ship.

## What you are walking into (and what you are not)

- The exercise is set on the branch you're sitting on right now: `sprint/auth-tests-and-docs`. Bearer auth, Vitest, the startup env-var safety check — all merged this week.
- Grayline is real-in-fiction: 200 employees, Denver, paying customer, three weeks live. Their CISO's name is **Aria Demir**. The analyst who finds the problem is **Maya**.
- You will be asked to read code paths, query the SQLite DB, draft customer comms, and call shots against a clock. You will not be asked to actually push code.
- No outside players. No surprise attendees. The room is the team plus a facilitator (and possibly a sixth-person evaluator if the calendar lined up).
- The injects will sometimes be hostile. The NPCs will sometimes be hostile. **The facilitator is not.** If you need a 30-second pause, ask for it.

## Roles

You will be assigned a role at kickoff. The facilitator has a list. Read all of these so you understand what the rest of the room is doing.

| Role | Owns | Notes |
|------|------|-------|
| **Incident Commander** (IC) | Severity declaration, sequencing, the call on disable-vs-mitigate | Holds the room. Names actions and owners out loud. |
| **AppSec / Eng Lead** | Reading `lib/ai.ts`, the SQL pattern-search query, fix-menu tradeoffs | Goes deep on the technical surface. Reports findings — does not unilaterally choose the fix. |
| **Founder / Customer Liaison** | Direct comms with Aria (Grayline CISO), the customer-trust call | Drafts what goes back to Aria. Can ask the room to review before sending. |
| **Scribe** | Decision log, timeline, gaps form — real-time capture | Captures what was decided, when, and why. Not a passive role — interrupts to ask "what did we just decide?" if it's unclear. |
| **Facilitator** | Pacing, injects, timekeeping, calling branches | Runs the clock. Plays NPCs. Out of play. |
| **Evaluator** *(optional, only if room has six)* | Scoring rubric, hotwash facilitation | Watches and scores against the rubric. Steps in for hotwash. |

Each named role owns at least one decision point during the exercise. You will not be a passive participant.

## Ground rules

- **Stay in the scenario.** If you want to break frame ("wait, in real life would we even have access to that audit log?"), the facilitator will field it as a meta question. Don't argue about realism mid-inject — note it for hotwash.
- **Decisions are made out loud, by the owner.** "I'm calling SEV-1 because…" — not "I think we should…" The IC names the call. The Founder names the customer comms. The Eng Lead names the technical recommendations.
- **The scribe captures the call, not the conversation.** If the scribe's pen isn't moving, no decision was made yet. If the room is debating, the scribe says "what's the decision and who owns it?" and waits for a name.
- **Time is real.** When the facilitator says "you have 8 minutes to call this," the clock starts. If you don't decide, the facilitator will note that as a finding for the AAR. Decision-velocity is itself one of the things being measured.
- **Blameless frame.** Nothing you say in this room shows up in a performance review. The AAR is written about the system, not the people. If you spot a gap, name it cleanly so we can fix it.
- **Phones face-down unless you're using them as a prop.** The facilitator will tell you when a "text from Aria" is arriving — not your real phone.

## Materials you should have at hand

Bring or have open in another window:

- The `lib/ai.ts` source file (you may need to read it under time pressure — `analyzeEmail()` is at line 102, system prompt at lines 15-36, the `bodyText.slice(0, 2000)` call at line 138-139).
- The `prisma/schema.prisma` `PhishingAlert` model.
- A blank text file for note-scratch.
- Coffee. Genuinely.

## What happens after

- **Hotwash** (15-20 min, in-room): ten questions, going around the room. The scribe captures answers in `forms/gaps-and-findings.md`.
- **AAR** (drafted within 24 hours): a written after-action report categorizing what went well, what didn't, and the gaps with severity tags. Owners get assigned to action items. The AAR is shared with the team — and, depending on what surfaces, possibly with Grayline.
- **Followups**: any P0 action items get worked into the next sprint. P1s get scheduled. P2s go to the backlog with a date.

## A note on tone

This scenario is plausible. The exact attack vector — prompt injection through hidden HTML in email — is documented in the wild, and SecureCatch's `lib/ai.ts` has the structural conditions for it. We're running this *now* — three weeks into our first paying engagement — because if it's going to surface, we'd rather it surface in a conference room than in a Slack screenshot.

It's going to be uncomfortable in places. That's the point.

See you in the room.
