# Gaps & findings — Approved & Erased

> Capture issues the exercise surfaced. One finding per row. Keep them concrete, observable, and tied to a real moment in the exercise. Vague findings ("we should communicate better") feed nothing actionable; specific ones ("the Comms Lead role had no defined channel for reaching the CEO outside business hours") feed AAR action items.

## Findings

| # | Finding | Surfaced at (T+) | Severity | Evidence | Suggested action |
|---|---------|-------------------|----------|----------|------------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

### Severity legend

- **High**: would have made the real incident worse, or would block recovery
- **Medium**: would have slowed the response or produced second-order pain
- **Low**: paper-cut; worth fixing but not urgent

## Likely findings to watch for

> The runbook is designed to surface these. Use as a checklist during hotwash to make sure you didn't miss any. Cross out any that did NOT come up — that itself may be a finding (the team has those covered, or they were never given a chance to fail).

- [ ] **`Approve & Remediate` has no human-in-the-loop or scope cap.** The dangerous primitive (domain-wide `batchDelete` from one click) was not gated by a two-analyst rule, an N-mailbox cap, a "wait 60s and require confirmation" delay, a counterparty allow-list, or a soft-delete-then-hard-delete-after-N-days pattern. This is the design gap the exercise primarily exists to surface.

- [ ] **No "stop the world" lever for SecureCatch existed before the exercise.** The team had to invent the queue-pause mechanism mid-exercise. In a real incident, that invention takes longer than the exercise budget.

- [ ] **The team did not know offhand what SecureCatch sends to OpenRouter.** They had to read `lib/ai.ts` to confirm. For a tool that triages email, this is a foreseeable question and the answer should be on the team's mental top shelf.

- [ ] **No "who tells the CEO" path.** When the EA paged at 11:46, the team had to figure out the comms ordering live. This is true in many orgs and is worth surfacing.

- [ ] **Vault recovery was not a rehearsed muscle.** Even if the team chose Vault, they probably did not know the exact path (matter → search → export → MBOX → reimport) without looking it up. That latency cost them in the exercise; it would cost more in real life.

- [ ] **Privileged content went to a third-party LLM provider with no contract review surfaced for retention.** The team probably did not know the OpenRouter retention terms by heart.

- [ ] **The SecureCatch on-call rotation was set up but not publicized.** When the CFO looped in the COO and asked by name, the team had to figure out who that was.

- [ ] **No defined press-response register.** Sasha's DM hit cold. The team had to decide register live: on-record, on-background, or no comment.

- [ ] **The two trajectory-changing branches (Phase 1 queue-pause; Phase 2 LLM-disclosure check) did not auto-trigger.** Both required at least one team member to think to do them. Whether they did is a hotwash datum.

## Findings that surfaced but were *not* in the design

> Sometimes exercises surface things the runbook didn't anticipate. Capture those here — they're often the most valuable findings of all.

- ...

## Things that went well

> Don't only capture the negatives. The hotwash should also identify what the team did right, especially under time pressure. These are the muscles to *protect* in any process redesign.

- ...
