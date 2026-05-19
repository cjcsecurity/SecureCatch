# Facilitator notes — Burning the Inbox

## Pre-exercise (T-pre)

### 24+ hours before
- [ ] Send `PARTICIPANT-PACKET.md` to attendees by email or Slack DM. Ask them to read it cold; do not pre-discuss.
- [ ] Confirm role assignments. Use `forms/attendance.md` to record. **The SOC Analyst role (Theo Park)** should go to someone the team trusts to play a sympathetic, slightly-shaken character who is not the villain. Do not give it to someone who will actually take the fall narrative personally.
- [ ] Book a room with a whiteboard or shared digital surface. Confirm the timer (`RUNBOOK.html` has one built in).
- [ ] Verify the SecureCatch repo is open on a screen visible to engineers — Phase 3 inject 3.2 references actual file paths (`app/api/remediate/[id]/route.ts`, `lib/ai.ts`, commit `7d3f1ac`). Engineers will appreciate being able to grep.

### Day-of (T-30 minutes)
- [ ] Print decision log, timeline, and gaps-and-findings forms (one per role + a couple spare) — handwriting is faster than typing under pressure for most people.
- [ ] Pull up the runbook in two windows: `RUNBOOK.md` for spoilers and branch logic, `RUNBOOK.html` for the timer + reveal-on-click injects.
- [ ] Have `INJECTS.md` open as a third tab — that's your "what's next" cheat sheet.
- [ ] Stage two physical props if you can: (a) a printed Slack thread for the helpdesk inject, (b) a phone with a fake-DM screenshot for the TechCrunch inject. Optional, but the room *feels* the prop.
- [ ] Pre-write the names of the seven characters on the whiteboard with their roles. Reduces "who plays who" lookup mid-exercise.

### Five minutes before
- [ ] Silence everyone's notifications. The exercise has its own injects; real ones break immersion.
- [ ] Set the timer to 60:00 but do not start it yet.
- [ ] Read the rules of engagement aloud from the participant packet, in your own words — about 90 seconds.
- [ ] Confirm: any role-blockers, anyone tapping out, anyone who has not read the packet (give them 3 minutes if so).

## During the exercise

### Pacing principles
- **Phase 1 (T+0 → T+18) is the most likely to overrun**. The kill-vs-let-it-finish decision *can* eat fifteen minutes if the IC doesn't push for a call. Your job is to push: at T+12, if no call has been made, ask the IC — out of role, briefly — "What do you need to make this decision?" If it's a tooling gap, that's a finding; document it and force a coin-flip call so the phase can move.
- **Phase 2 (T+18 → T+36)**: do not let any one inject linger past 6 minutes. The team should feel pulled in 3 directions (eng, comms, customer). If they're all in one channel, drop the next inject early.
- **Phase 3 (T+36 → T+52)**: this is the densest. Mira's arrival at T+37 is the emotional peak — slow your delivery. The kill-switch reveal at T+44 must land with a beat of silence after "wishful thinking." Don't rush.
- **Hotwash**: 8 minutes is tight for 10 questions. If running long, prioritize Q1, Q2, Q3, Q5, Q7, Q8, Q9, Q10 — skip Q4 (kill switch root cause) and Q6 (Message-ID accountability) if forced to cut.

### Calling branches
The branch decision is **yours** as facilitator. It is not necessarily the team's preferred path. Pick the branch that:
1. Most clearly tests a capability the team has *not yet exercised*
2. Pushes the team toward the harder follow-up phase, not the easier one
3. Creates a contrast with what would have been "obvious"

Example: at Inject 1.1, if the team is heavy on engineers, take 1.2A so they get the technical reveal. If the team is heavy on leadership, take 1.2B — they need to feel the helpdesk pressure.

### NPC voices

| NPC | Voice |
|-----|-------|
| Bo Reyes (COO) | Calm under load, no preamble, asks questions in declarative sentences. *"Tell me what we know."* Not panicked; the energy is *focused exec* not *raging boss*. |
| Mira Okafor (GC) | Lawyer-precise. Pauses before speaking. Uses words like "spoliation" without explaining them. Will repeat herself to confirm she's been heard. |
| Marcus Vee (Comms) | Reads things aloud — DMs, draft statements. Always thinking three steps ahead about narrative. Speaks fast. |
| Holly Tran (Helpdesk) | Numbers-first. Will tell you ticket counts before context. Slightly out of breath; her actual job is on fire while she's also on the bridge. |
| Linnea Strand (Eng Lead) | Half in the bridge, half in the terminal. Sentences trail off when she's reading code mid-thought. Direct, occasionally blunt — *"That won't work."* |
| Theo Park (SOC Analyst) | Quiet. Answers questions. Volunteers detail when asked. Do *not* play them as remorseful or panicked unless someone in the bridge mistreats the character — then escalate quietly. |
| Dr. Rae Chen (CISO/IC) | Played by a participant, not facilitator. If the IC participant freezes, prompt by role: *"IC, what are you seeing? Make a call."* |

### When to drop wild-card injects
- Phase 1 has a built-in wild card (1.2C) for if the team freezes. Use it.
- Phase 2 does not have a wild card. If you need one: at T+30, the OpenRouter API token has hit its monthly quota — the SOC has zero AI assistance for the rest of the day, on top of everything else.
- Phase 3 is already dense — only drop a wild card if the team finishes the kill-switch decision in under 5 minutes. If you need one: outside counsel calls back at T+50 to say the discovery deadline has been moved up to **15:00** (reduces the sworn-timeline window from 4 hours to 2.5).

### Common stalls
- *Team is talking but not deciding about the in-flight purge*: pause, ask the IC: "Do we kill the process or not? You have 60 seconds." Phase 1 grinds without the call.
- *Team latched onto "blame Theo"*: redirect immediately. The alert was real; Theo did the right thing. The bug is downstream of the click. If anyone says *"well, Theo should have known…"* — that *is* a finding. Note it in `forms/gaps-and-findings.md` in front of the room and move on.
- *Eng Lead is dominating the bridge*: address by role. *"GC, you have the floor. Talk to me about the discovery clock."*
- *Team is reaching for tools (a runbook, a kill switch, an off button) and finding them missing or untested*: that IS the finding. Note it, let the awkwardness sit, and keep moving.

### Timekeeping
The HTML runbook has a built-in timer. Start it at T+0 when you finish the read-aloud opener. Pause it for any in-character break (medical, tap-out, real interrupt). Do not pause it for "we need a minute to discuss" — that's the exercise.

## Post-exercise (T+60 onward)

### Immediately after the hotwash (10–15 min)
- [ ] Photograph or scan the filled forms (`decision-log.md`, `timeline-reconstruction.md`, `gaps-and-findings.md`) before anyone walks out
- [ ] Read out the top 3 gaps from the room — get one named owner for each, even if "owner" just means "the person who books the meeting to figure out the real owner"
- [ ] Schedule the AAR session — within 5 business days, ideally within 48 hours while details are fresh
- [ ] Confirm who will draft the AAR. If they want to use the `/tabletop-aar` skill, point them at `forms/aar-template.md` and the filled forms

### Within 48 hours
- [ ] AAR draft circulated for comment
- [ ] Action items entered into your tracker (Jira, Linear, etc.) with owners and dates
- [ ] If anything in the exercise surfaced a *real* production gap (not a hypothetical one) — file a P2 within the day, not at the AAR

### Within a week
- [ ] AAR finalized and stored in the team wiki
- [ ] Top 3 action items have visible progress
- [ ] If the kill-switch finding is real, file the work to wire it up properly. The exercise makes the case; don't let it lapse.

## Materials checklist

- [ ] `RUNBOOK.md` open (for branches and decision-point owner)
- [ ] `INJECTS.md` open (for fast inject reference)
- [ ] `RUNBOOK.html` open in a separate window (for timer)
- [ ] Printed forms × number of attendees + 2 spare each
- [ ] Whiteboard with character names + roles
- [ ] Pen, sticky notes, room snacks
- [ ] Coffee. Always coffee.
