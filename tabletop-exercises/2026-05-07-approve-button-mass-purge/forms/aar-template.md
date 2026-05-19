# After-Action Report — Approved & Erased

> This is an empty AAR skeleton for the `/tabletop-aar` skill to fill in. Run it after the hotwash, against this exercise directory. The skill reads `decision-log.md`, `timeline-reconstruction.md`, `gaps-and-findings.md`, and `attendance.md` to produce a structured AAR.

**Exercise**: Approved & Erased — When the Trash Button Wipes the Boardroom
**Date**: __________
**Duration**: 30 minutes (plus ~15-20 min hotwash)
**Facilitator**: __________
**Participants**: see `forms/attendance.md`

---

## Executive summary

*(2-3 paragraphs. What was the scenario, what happened in the room, what's the headline finding, what changes as a result. Written for someone who did not attend the exercise — likely an executive sponsor.)*

---

## Scenario recap

*(Concrete one-paragraph version of what the team faced. Pull from `RUNBOOK.md` § Scenario summary if helpful.)*

---

## Timeline reconstruction

*(Pull from `forms/timeline-reconstruction.md`. Format: a clean before / during / after table. Include latency analysis.)*

---

## What went well

*(Specific moments where the team got it right. Use observed behavior, not generic praise. Each entry tied to a T+time and a person or role.)*

1.
2.
3.

---

## What didn't

*(Specific failures, gaps, or near-misses. Tied to a T+time and a finding from `gaps-and-findings.md`.)*

1.
2.
3.

---

## Findings

*(Pull from `gaps-and-findings.md`. Format: # | Finding | Severity | Evidence | Why it matters.)*

| # | Finding | Severity | Evidence | Why it matters |
|---|---------|----------|----------|----------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Action items

*(Each finding should map to one or more action items. Each action item must have an owner and a due date. No "team to investigate" with no name attached.)*

| # | Action | Owner | Due | Source finding | Status |
|---|--------|-------|-----|----------------|--------|
| 1 | | | | | open |
| 2 | | | | | open |
| 3 | | | | | open |

### Recommended action items the AAR generator should consider proposing

> The `/tabletop-aar` skill should evaluate whether each of these is supported by the exercise evidence. Don't propose any that didn't actually surface.

- **Add a scope cap to `Approve & Remediate`**: never delete from > N mailboxes without two-analyst approval. Choose N from observed deletion counts (the runbook scenario was 1,847 across 412 mailboxes; a sensible default cap is much lower).
- **Switch `users.messages.batchDelete` to `users.messages.trash`** with a 7-day retention before hard-delete. Recoverable by design.
- **Add a counterparty allow-list**: outside-counsel domains, M&A counterparty domains, and known privileged-correspondence senders are auto-flagged for two-analyst review regardless of AI confidence.
- **Document and publicize the SecureCatch on-call rotation.** Add to the on-call directory used by IT shared inbox, exec assistants, and finance.
- **Audit OpenRouter retention terms and document on the SecureCatch tool inventory.** Confirm whether email body content is retained, for how long, and whether it is used for training.
- **Add a one-click "freeze the queue" admin action** to SecureCatch. Visible from the dashboard, requires Security Lead authorization to unfreeze.
- **Define and publish the "who tells the CEO" path** for Thursday-noon-no-warning incidents.
- **Schedule a follow-up tabletop in 90 days** that re-tests `Approve & Remediate` after the redesign ships.

---

## Recommendations

*(Higher-level than action items. What patterns does this exercise — combined with `2026-05-07-poisoned-phish` — suggest about SecureCatch's safety envelope?)*

1.
2.
3.

---

## Cross-exercise notes

*(If gaps from this exercise also appeared in `2026-05-07-poisoned-phish`, list them here. Repeated gaps are systemic and should be prioritized accordingly.)*

| Gap | Showed up in | Priority |
|-----|--------------|----------|
| | | |

---

## Distribution

*(Who gets this AAR. Default: all participants, the head of security, the CISO, the head of engineering. Controlled distribution — this AAR contains observed weaknesses in production tooling.)*

- Participants: yes
- Security leadership: yes
- Engineering leadership: yes
- Executive sponsor: yes
- Broader org: redacted summary only
