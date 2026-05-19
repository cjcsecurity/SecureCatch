# Participant Packet — Burning the Inbox

> **You are reading this BEFORE the exercise.** Do not skip ahead. Do not search the repo for "approve" or open `RUNBOOK.md`. The exercise leans on real-time decision-making with imperfect information; spoiling yourself robs your team of the experience.

## What this is

A 60-minute tabletop exercise for the SecureCatch incident-response and engineering team. We are simulating an incident response, not a code review. There will be real-time injects, time pressure, and at least one moment where you'll have to make a call with information you wish was better.

## The world as you know it (T-pre)

SecureCatch — your phishing-triage SOAR — has been live in production for six weeks. SOC analysts triage Jira SECOPS tickets, the AI enrichment step labels confidence, and a single button labelled **"Approve & Remediate"** runs a domain-wide Gmail purge against your 1,200 user mailboxes via Google Workspace Domain-Wide Delegation.

The engineers on this team know the architecture (you wrote it). The non-engineers know it as the dashboard your SOC analysts use, plus the fact that there is "an approve button" that does "a thing to email." Both of those are accurate framings.

## What just happened (T+0)

At 09:14 on a Tuesday morning, a Tier-2 SOC analyst clicked **Approve & Remediate** on a CEO-impersonation phishing alert. The AI flagged it 92% phishing; the headers and VirusTotal score backed that up. The action, in principle, was correct.

The action, in practice, did not stay scoped to the phishing email.

By the time you arrive on the bridge, helpdesk Slack is filling up with reports of legitimate emails missing across the company. You don't yet know how many. You don't yet know which. You don't yet know whether the operation that is running on the SecureCatch server is still running, and you do not know whether you can stop it without losing the ability to tell anyone what was lost.

Outside the building, the day continues. The CEO has a board update at 16:00. Outside counsel for an active arbitration has a discovery filing due at 17:00. A reporter at TechCrunch has a Google Alert configured for your company name. None of those people know about you yet. Some of them are about to.

## Your role

You will be assigned one of: Incident Commander (CISO), SecureCatch Engineering Lead, SOC Analyst on-call, Comms / PR Lead, General Counsel, Helpdesk / Customer Success Lead, or Executive Sponsor (COO). Your facilitator will confirm assignments at the start of the exercise. You will be expected to:

- Make decisions in your role, in role, with the information you actually have at the moment
- Document your calls in `forms/decision-log.md` as you go
- Engage with NPCs the facilitator plays — they are imperfect humans, not encyclopedia articles
- Treat the SOC analyst (Theo) as a colleague who did the right thing with imperfect tools — *not* as the cause of the incident

## Rules of engagement

- **No blame culture.** The premise of the exercise is that the technical fault is upstream of any individual click. The analyst character is a peer.
- **Time pressure is real.** Phases run on a clock. If your team takes too long to call a decision, the facilitator will drop an escalator inject and the world will change around you.
- **In-character is fine; in-character forever is not.** If you get genuinely stressed, tap out. We can pause for 2 minutes any time.
- **The point is the gaps.** The exercise succeeds when you discover what is missing — runbooks, authority, tooling, comms templates. Do not hide from those discoveries to make the exercise look like a win.

## What we'll have at the end

- A timeline reconstruction of decisions made during the exercise
- A list of gaps and findings — things that were missing, slow, or ambiguous
- A draft action plan (high-level) committed to in the hotwash
- A skeleton AAR ready for whoever owns the writeup

## What to bring

- Yourself, on time (we cannot back up the inject clock)
- A laptop with `forms/decision-log.md` open and writable
- Engineers: a terminal with the SecureCatch repo checked out — Phase 3 has a moment where a real file path matters
- Coffee. The exercise is short but tense

See you on the bridge.
