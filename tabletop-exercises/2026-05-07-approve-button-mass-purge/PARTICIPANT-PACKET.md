# Participant packet — Approved & Erased

> **Read this before the exercise. Do not read the runbook (`RUNBOOK.md`) — it contains spoilers and live injects. This packet has everything you need to show up ready.**

## What this is

A 30-minute tabletop exercise about SecureCatch — the in-house phishing-triage SOAR your team shipped to prod three weeks ago. The exercise is *not* about an external attacker. It is about what happens when the tool we built does exactly what it's designed to do, on the wrong email, at the wrong moment.

We ran a tabletop earlier today (`poisoned-phish`) about the LLM stage failing. This one is the operational counterpart: the LLM was right, the AI confidence was high, the OSINT lined up, and the analyst still made a call that nuked something they shouldn't have. Different muscle.

## The world, as of T+0

It's a Thursday at SnapDocs, 11:48 in the morning. Maya, the SOC analyst on rotation, has been working the SECOPS Jira queue. SecureCatch has been a quiet win since launch: AI confidence steady in the high 80s, VirusTotal hits lining up, the "Approve & Remediate" button doing its one job.

Five minutes ago, Maya clicked Approve on alert `SC-2104`. The AI summary called it a high-confidence Business Email Compromise impersonating outside counsel. VirusTotal returned 7 of 89 engines flagging the URL. Confidence: 94%. Standard pattern. The remediation fired and the message was purged from every inbox in the org via the service account's `gmail.modify` scope.

Then the CEO's executive assistant paged the IT shared inbox: a thread from outside counsel — Reece Park at Bigfish Legal — has vanished from the CEO's inbox. The CEO is in a meeting with the bank in nine minutes. The thread contained the definitive agreement and wire instructions for the acquisition that closes Friday. The CFO is asking where the wire details went. Aria, head of security, has just typed "did SecureCatch eat a real email" into the incident channel.

You have until somebody else clicks Approve on the next alert in the queue to figure out what's stoppable, what's recoverable, and who tells whom.

## Your role

You'll be assigned one of:

- **Incident Commander** — runs the room, calls the timeline, owns severity and the all-clear
- **Security Lead** — owns containment of SecureCatch's blast radius and classifies the sensitivity of what was lost
- **Engineering Lead** — owns the actual code path; pauses the queue if needed
- **Comms / People Ops Lead** — owns internal register and who tells the CEO; press posture
- **Legal / Privacy Lead** — owns M&A privilege exposure (incl. via OpenRouter), recovery posture, outside counsel coordination

Role assignments will happen at the start of the exercise. You will not have your role in advance — that is on purpose. Real incidents don't pre-assign.

## What to think about before you arrive

Three questions, no need to write anything down:

1. **What can `Approve & Remediate` actually do, when you click it?** If you don't know offhand, that's a fine answer to bring into the room.
2. **What does SecureCatch send to OpenRouter, and what does our contract with OpenRouter say about retention?** Same — "I don't know" is a useful answer.
3. **In your real working life, who tells the CEO when something goes wrong on a Thursday at noon, with no warning?** What's the actual ordering — is it the IC, the CISO, the chief-of-staff, the EA?

Don't research these. Just sit with them for two minutes before the exercise so they're not new ideas when they come up.

## Logistics

- **Duration**: 30 minutes hard cap, plus 15-20 minutes hotwash after
- **Location / link**: _____ (facilitator fills in)
- **Bring**: a laptop with the SecureCatch repo open at `lib/ai.ts` and `app/api/remediate/[id]/route.ts` — you may want to look something up mid-exercise. Do not pre-read these files; if they're relevant, you'll know in the room.

## Ground rules

1. **No "well actually we'd just call X"** unless X is a person who is in the room or unambiguously reachable. The point is to surface what we'd actually do, not what we'd do in a perfect world.
2. **Decisions get logged.** The Evaluator will capture every call in `forms/decision-log.md` with timestamps. You can change your mind, but the original call gets logged too.
3. **The exercise is for learning, not for blame.** Maya is a real person on the team. In the exercise she made a call any of us could have made. After-action work focuses on the *system*, not the analyst.
4. **You can call a 60-second pause** at any point if you need to think. You cannot call a five-minute pause — the clock keeps moving.
5. **No phones / no notifications** for the 30 minutes. Aria will say something is buzzing if it's relevant to the scenario.

That's it. See you in the room.
