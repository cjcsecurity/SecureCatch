# After-Action Report — Poisoned Phish: When the Email Triages the Triage Tool

> **Date**: 2026-05-07 · **Duration**: 90 min planned · **Audience**: eng + leadership · **Facilitator**: _________
> AAR drafted _________

## 1. Executive summary

<!-- Hint: 3-5 sentences max. State (a) what was tested, (b) who attended at high level (count + roles), (c) the top 3 takeaways, (d) the top 3 action items by severity. Re-read §4-§7 before writing this. -->

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

## 2. Exercise overview

- **Scenario**: Poisoned Phish — a prompt-injection attack on SecureCatch's LLM classifier, with a customer-side detection by a Grayline analyst, escalating into a customer-trust call and an engineering-tradeoff fix decision.
- **Objectives**:
  - Detect AI-output manipulation when the manipulated artifact looks internally consistent
  - Scope the blast radius across past alerts using the data the team actually has
  - Make a customer-trust call with a small founding team and incomplete information, on someone else's clock
  - Produce a same-day mitigation plan with honest tradeoffs
- **Attendees**: _________ (count + roles)
- **Duration**: 90 min planned · _________ actual
- **Format**: ☐ in-person  ☐ hybrid  ☐ remote
- **Materials used**: RUNBOOK.md, INJECTS.md, RUNBOOK.html, decision-log.md, timeline-reconstruction.md, gaps-and-findings.md, attendance.md
- **Regulatory or framework hook** (if applicable): _________

## 3. Timeline reconstruction

<!-- Hint: phase-by-phase narrative built from forms/decision-log.md and forms/timeline-reconstruction.md. Use the ACTUAL timestamps captured during the exercise, not the planned timing. Stay factual — commentary belongs in §4 and §5. -->

### Phase 1 — Maya Pulls a Receipt

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

### Phase 2 — Drag the Net Through the Logs

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

### Phase 3 — The Worse Email

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

### Phase 4 — Fix-It Friday Doesn't Wait Until Friday

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

## 4. What went well

<!-- Hint: 4-7 bullets. Each bullet: specific behavior + cite by timestamp + why it mattered. Tie each to an exercise objective. BLAMELESS framing — credit the system and the role, not just individuals. Don't sandbag. -->

- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________

## 5. What didn't go well

<!-- Hint: 4-7 bullets. BLAMELESS — describe behavior as system gaps, not individual fault. Cite the decision log by timestamp. Each bullet must be specific, not a vibe. If the team failed badly somewhere, say so plainly. -->

- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________

## 6. Gaps identified

<!-- Hint: pull directly from forms/gaps-and-findings.md. Each gap = description + evidence cite + severity tag (P0/P1/P2). Omit a sub-section entirely if no findings fall into it; do not pad. -->

### 6.1 Technical

- **_________** [P_] — _________
- **_________** [P_] — _________

### 6.2 Process

- **_________** [P_] — _________
- **_________** [P_] — _________

### 6.3 Communication

- **_________** [P_] — _________
- **_________** [P_] — _________

### 6.4 People / training

- **_________** [P_] — _________
- **_________** [P_] — _________

## 7. Action items

<!-- Hint: ordered by severity (P0 first, then P1, then P2). Every item has a real owner and a real deadline — no "TBD". If facilitator didn't capture an owner, write `OWNER NEEDED`. Aim for 5-12 items. Verb-led action phrasing. -->

| # | Action | Owner | Severity | Target | Tracking |
|---|--------|-------|----------|--------|----------|
| 1 | _________ | _________ | P0 | _________ | _________ |
| 2 | _________ | _________ | P0 | _________ | _________ |
| 3 | _________ | _________ | P1 | _________ | _________ |
| 4 | _________ | _________ | P1 | _________ | _________ |
| 5 | _________ | _________ | P2 | _________ | _________ |

## 8. Recommendations for next exercise

<!-- Hint: 3-5 bullets. Driven by the gaps surfaced this time — what's still untested? Plus format adjustments and who else should be in the room. Concrete, not generic. -->

- _________________________________________________________________
- _________________________________________________________________
- _________________________________________________________________

## 9. Appendices

### A. Decision log (raw)

<!-- Embed the full content of forms/decision-log.md here verbatim. -->

_________________________________________________________________

### B. Gaps captured during exercise

<!-- Embed the full content of forms/gaps-and-findings.md here verbatim. -->

_________________________________________________________________

### C. Attendance

<!-- Embed the full content of forms/attendance.md. Anonymize names to roles only if audience is regulator or board. -->

_________________________________________________________________

### D. Timeline (raw)

<!-- Embed the full content of forms/timeline-reconstruction.md here verbatim. -->

_________________________________________________________________

---

> *AAR drafted by `/tabletop-aar` from filled forms in `tabletop-exercises/2026-05-07-poisoned-phish/`. Findings cite the decision log; corrections welcome — open the markdown and edit, then re-export HTML if used.*
