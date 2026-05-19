# Timeline reconstruction — Approved & Erased

> Filled out during the exercise (by the Evaluator) and finalized in hotwash. Goal: a clean before/during/after timeline the AAR can use to identify where time was lost or won.

## Pre-incident (the world before T+0)

| Real time | What happened | Who knew |
|-----------|---------------|----------|
| ~3 weeks before T+0 | SecureCatch shipped to prod with `Approve & Remediate` calling `gmail.modify` domain-wide | Eng team, Security Lead |
| ~1 week before T+0 | Last security review of SecureCatch | (fill in based on real history) |
| 11:43:07 of exercise day | Maya clicks Approve on `SC-2104`; 1,847 messages deleted from 412 mailboxes | SecureCatch logs only, no human |
| 11:46 | EA pages IT shared inbox about missing thread | EA, IT shared inbox subscribers |
| 11:48 | Aria types "did SecureCatch eat a real email" in incident channel | Channel members |

## During the exercise (T+0 to T+30)

| T+ | Real time | Event | Source | Team's response (if any) | Latency |
|----|-----------|-------|--------|--------------------------|---------|
| 0 | | Read-aloud opener | Facilitator | | |
| 2 | | 💉 1.1 — audit log shows `batchDelete` | Eng Lead voice | | |
| 5 | | 💉 1.2A or 1.2B (which one?) | Comms Lead / Eng Lead | | |
| 7 | | 💉 1.2C (if dropped) | Eng Lead | | |
| 8 | | ⚡ Decision 1 forced | Facilitator | | |
| 13 | | Read-aloud bridge (Phase 2) | Facilitator | | |
| 14 | | 💉 2.1 — Priya on LLM disclosure | Live NPC | | |
| 18 | | 💉 2.2A — recovery options | Eng Lead voice | | |
| 22 | | 💉 2.3 — Sasha Wren press DM | Live NPC | | |
| 25 | | ⚡ Decision 2 forced | Facilitator | | |
| 28 | | Closing read-aloud | Facilitator | | |
| 30 | | Exercise ends | | | |

## Post-incident (the imagined hour after T+30)

> Capture what the team said *would* happen next. Useful for the AAR to compare against real practice.

| Imagined time | Action | Owner | Trigger |
|---------------|--------|-------|---------|
| 14:00 | CEO meeting with IC, Security Lead, Eng Lead | IC | (CEO request) |
| Same day | Postmortem doc started | Evaluator → IC | n/a |
| Within 24h | Vault export of remaining ~1,800 messages | Eng Lead | Decision 2 |
| Within 24h | Decision on `Approve & Remediate` redesign | Security Lead w/ Eng Lead | Decision 1 |

## Latency analysis (filled in hotwash)

> For each major decision, what was the latency from "information arrived" to "decision made"? This is the most useful raw material for the AAR.

| Information arrived | Decision made | Latency | Was the latency justified? |
|---------------------|---------------|---------|----------------------------|
| 💉 1.1 audit log | Decision 1 (severity + queue) | | |
| 💉 2.1 Priya | Acknowledged LLM disclosure | | |
| 💉 2.2A recovery options | Decision 2 (recovery path) | | |
| 💉 2.3 Sasha | Decision 2 (press posture) | | |

## Counterfactuals worth noting

> What might have happened if a decision had been made earlier, later, or differently? Don't speculate wildly — but a single "if the queue had been paused at T+3, Jordan wouldn't have had the chance to fire 1.2C" is worth writing down.

- ...
