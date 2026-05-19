# Facilitator notes — Poisoned Phish

> Pre-exercise prep for whoever is running the room. Work this checklist start-to-finish before participants arrive. The goal is that when the timer starts, you don't have to think about logistics — just pacing, NPC voices, and which branch to call.

## At-a-glance

- **Date**: Tuesday 2026-05-07 (in-fiction wall clock starts at 14:47)
- **Duration**: 90 minutes hot, ~15-20 minutes hotwash, ~10 minutes wrap → block **2 hours total**
- **Participants**: 4-6 (3 named roles + facilitator + scribe minimum; add Evaluator if you have a sixth)
- **Format**: in-room preferred; remote works if everyone's on video and the facilitator has a second screen for the inject deck

## T-24h or earlier

- [ ] Send `PARTICIPANT-PACKET.md` to attendees. **Verify only the packet went out.** Do not send `RUNBOOK.md`, `INJECTS.md`, or any of the forms. The packet is a strict subset; everything else is the facilitator's tools.
- [ ] Confirm role assignments. Default mapping for a 3-person founding team:
  - **Founder/Customer Liaison** → CJ (or whoever owns the Grayline relationship)
  - **Incident Commander** → engineer with most ops/IR muscle
  - **AppSec/Eng Lead** → engineer most familiar with `lib/ai.ts`
  - **Scribe** → whoever has the cleanest handwriting / typing speed
  - **Facilitator** → outside the founding team if possible (an advisor, an investor with sec background, a contractor); if not, the founder runs it but does not play a role
- [ ] If you don't have a Scribe-only seat, designate one of the named roles to also scribe. Note: this is a known compromise — the Scribe role exists because real-time capture is hard while also being in the scenario. Plan for thinner notes.
- [ ] Send a calendar block with the 2-hour window and a one-line agenda. Don't preview the scenario beats.

## T-2h

- [ ] Read `RUNBOOK.md` end-to-end once.
- [ ] Read `INJECTS.md` end-to-end once. Read it again with a focus on the branch logic.
- [ ] Pick a default for **Inject 2.2** James Park compromise: "MFA enrolled" (default — full account access, harder recovery) or "MFA prompt declined" (credentials submitted but attacker doesn't have full access). Don't switch mid-exercise.
- [ ] Pick a default for the **Decision 2.1 "no decision in 8 min"** branch: which way do you role-play the IC? Default to whichever direction the team was leaning when the clock ran out; if they were genuinely deadlocked, default to "disable" (the more conservative call).

## T-30m: room and materials

- [ ] **Room layout**: round-table preferred. Whiteboard within reach. Power strips for laptops. The Scribe should have a clear line-of-sight to the IC and the Founder.
- [ ] **Timer**: open `RUNBOOK.html` in a browser. The header timer is the source of truth. If the HTML doesn't render right, fall back to a phone timer set to 90 minutes.
- [ ] **Print materials** (one copy each on the table):
  - The 10 hotwash questions (printed, not on screen — kills the side-conversation problem)
  - `forms/decision-log.md` blank (a printed copy is more honest than a Google Doc that nobody updates in real time)
  - `forms/timeline-reconstruction.md` blank
  - `forms/gaps-and-findings.md` blank
- [ ] **Paste-buffer prep** — open a text editor with these ready to copy-paste live, in order:
  - Inject 1.1 — Maya's full reasoning quote + "we don't have a runbook section 4.2"
  - Inject 1.2A — the hidden-div HTML block (verbatim from `INJECTS.md`)
  - Inject 1.2B — Maya's "I read the raw body" follow-up
  - Inject 1.2C — Maya's "escalated to Aria" wild-card
  - Inject 1.3 — Jamie's status-call email (with Aria cc'd)
  - Inject 2.1 — the SQL query + the eleven-row result table
  - Inject 2.2 — Aria's click-telemetry email
  - Inject 3.1 — the SYSTEM_OVERRIDE hidden block + Aria's "Tell me you didn't" text
  - Inject 3.2 — the @spectre_h tweet
  - Inject 3.3 — Aria's "two questions" email
  - Inject 4.1 — the four-option fix menu
  - Inject 4.2 — Sasha Vora's email
- [ ] **Mock screenshots** (optional but recommended):
  - A fake SecureCatch alert page screenshot for Inject 1.1 (Classification: Safe, Confidence: 95, subject + link). Crop tight; serif font for the email subject. Don't put the SecureCatch logo on it — the team should recognize the page from the actual UI.
  - A fake Workspace audit-log query result for Inject 2.2. CSV-style formatting in a screenshot is fine.
  - The @spectre_h tweet rendered as a Twitter card for Inject 3.2.
- [ ] **Phone props**: have a second phone (or a "fake SMS" web tool open) for the two text messages from Aria — the "Tell me you didn't" line in Inject 3.1, and the James Park relay in Inject 4.2 NPC voice. Reading them off your laptop kills the punch.

## T-5m: kickoff

- [ ] Verify all participants are present and assigned. Don't start a person short — wait, or pull someone in from outside the founding team (an advisor, a friend with sec background) to fill the gap.
- [ ] Re-state the ground rules out loud (don't trust people to have read the packet):
  1. Stay in scenario. If you want to break frame, raise it as a meta question after the inject.
  2. Decisions are made out loud, by the owner. Name the call.
  3. Scribe captures the call, not the conversation.
  4. Time is real. The clock doesn't care about debate.
  5. Blameless frame.
  6. Phones face-down unless the facilitator hands you one as a prop.
- [ ] Read the cold-open opener (`RUNBOOK.md` Phase 1 read-aloud). Read it slowly. The italic line ("is this what it's supposed to do?") should sit in the air before the timer starts.
- [ ] Start the 90-minute timer. Note the wall-clock T+0 in the decision log.

## During the exercise

### Pacing rules of thumb

- If the team converges on an answer in under 3 minutes for any decision, drop a complication. (Inject 1.2C, the researcher tweet, Sasha Vora — pick the one that doesn't break the phase.)
- If the team is deadlocked and the decision window has closed, role-play the IC making a unilateral call. Note as decision-velocity gap. **Don't bail them out by talking past the clock.**
- If energy crashes mid-phase, drop a phone-screen prop. Aria's "Tell me you didn't" text can move earlier; the @spectre_h tweet can move earlier. Don't move them later — that breaks the phase logic.
- Keep the room talking. If the IC stops naming actions, ask "what's the next concrete action and who owns it?"

### NPC voices (you play all of them unless you have a co-facilitator)

- **Aria Demir, CISO** — calm, clipped, slightly cold in Phase 2. Talks past the team. By Phase 3 the calm is "load-bearing" — a hairline crack is audible. The "Tell me you didn't" text is the inflection. Don't be theatrical; she's not yelling. She's a CISO doing her job.
- **Maya, SOC analyst** — sharp, technical, friendly. Will push back if the team condescends ("I read your DB. I know what I'm looking at."). Channel: Slack screenshot first, then DMs. Keep her voice young-ish — she's a working analyst, not a sec lead.
- **James Park, finance manager** — never speaks directly. Voiced through Aria's relay. The "Where's the invoice" line should land flat. He's not angry; he just needs to pay a bill.
- **@spectre_h** — never voiced. Tweets only. Pressure source, not a participant.
- **Sasha Vora, fintech CISO** — polite, decisive, professional. She's not mad; she's seen this movie before. Read her email at a moderate pace; the politeness is the pressure.

### Reading the room

- *Slow down when*: the IC hasn't named an owner in 5+ minutes; multiple people are taking notes that disagree; the Founder is staring at the screen instead of drafting.
- *Push harder when*: long silences, side conversations starting, the same point getting re-litigated.
- *Hard stop when*: someone is visibly stressed in a not-productive way. Pause, name it, give a 2-minute break. The exercise is for learning. If you push someone past the productive line, you've broken the next exercise too.

## Post-exercise

- [ ] Stop the timer at T+90 (the closing read-aloud).
- [ ] Hand the printed hotwash questions to the Scribe. The Scribe runs the hotwash; the Facilitator answers meta questions only.
- [ ] Run the 10 hotwash questions in order. ~90 seconds per question. **Do not let the room re-litigate decisions.** The hotwash is for surfacing gaps, not relitigating tradeoffs.
- [ ] Capture answers in `forms/gaps-and-findings.md` as you go.
- [ ] Wrap with: "Within 24 hours, the AAR will be drafted from these forms. P0 action items go into next sprint. Thanks for showing up."
- [ ] Photograph or scan the printed forms. Type up into the digital versions before end of day.

## Common pitfalls

- **Reading the injects too fast.** The team needs time to read the screen, ask each other clarifying questions, and start working. After dropping an inject, count to ten in your head before saying anything.
- **Letting Aria be sympathetic.** She is not. She is a CISO whose vendor just compromised her finance manager. Her job is Grayline; not your feelings. Play her cold in Phase 2 and only let the calm crack slightly in Phase 3.
- **Saving the team from their own decisions.** If the IC decides SEV-2 in Phase 1, do not "correct" them mid-exercise. Let SEV-2 ride. Phase 2's pressure should make the call obviously wrong; the AAR captures that the call was wrong and why.
- **Mid-exercise meta debates.** If someone says "wait, would we even have access to this in real life?" — note the question, give a 5-second "we'll handle it in hotwash, treat it as available," and move on. Don't pause the timer.
- **Overplaying @spectre_h.** The tweet is pressure, not engagement. Do not let the team start drafting a DM to the researcher. Block that with: "OK, you DM'd them. They haven't responded. Move on."

## If something genuinely goes wrong

- **Tech failure** (HTML runbook crashes, screen sharing dies): pivot to the printed paste-buffer text. The exercise is the inject sequence, not the HTML.
- **A participant has to leave**: pause, ask the IC to redistribute their owned decisions, restart. If the IC has to leave, you (facilitator) call the exercise.
- **Real-world incident interrupts**: stop the exercise. The drill is the drill; the real incident is the incident. Reschedule the rest.

## Materials checklist (one final pass before T-0)

- [ ] PARTICIPANT-PACKET.md sent ≥ 24h ago, confirmed read by all participants
- [ ] All paste-buffer text open in a text editor in chronological order
- [ ] Mock screenshots staged (alert page, audit log, tweet) — optional but recommended
- [ ] Phone prop ready for the two Aria texts
- [ ] Printed copies on the table: hotwash questions, decision log, timeline form, gaps form
- [ ] Whiteboard markers within reach
- [ ] Timer set to 90:00 in `RUNBOOK.html` and ready to start
- [ ] You've read `INJECTS.md` end-to-end and can name the next inject without looking
- [ ] Coffee
