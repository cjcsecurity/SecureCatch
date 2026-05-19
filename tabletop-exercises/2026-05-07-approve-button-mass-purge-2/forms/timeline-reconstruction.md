# Timeline Reconstruction — Burning the Inbox

> Fill in during and after the exercise. The hotwash leans on this; the AAR depends on it. Use T+ time, not wall clock.

## High-level timeline

| T+ time | Event | Source / channel | Who was aware |
|---------|-------|------------------|---------------|
| 0:00 | Theo clicks Approve & Remediate on `phl_4f2c…b8` | SecureCatch UI | Theo |
| 0:00 | Domain-wide purge loop begins, sequential through `listAllDomainUsers()` | server logs | (no one yet) |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## Decision boundary timeline (sworn-timeline-grade)

> This is the timeline Mira (GC) needs in writing by 14:00 in the scenario. In a real incident, this is the timeline you'd hand to outside counsel. Be precise.

| T+ time | Action / event | System of record | Confidence (high / med / low) | Evidence available? |
|---------|----------------|-------------------|-------------------------------|---------------------|
| 0:00 | Click recorded | SecureCatch DB (`phishingAlert.id = phl_4f2c…b8`, `analystAction = REMEDIATE`) | High | DB row + Next.js access log |
| 0:00 → 0:?? | Per-user `trashMessageForUser` calls | server logs + Gmail audit log | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

## Affected users (final count)

- **Total users searched:** ____________
- **Total users with messages trashed:** ____________
- **Estimated total messages trashed:** ____________
- **List of affected user emails:** see SecureCatch DB `phishingAlert.purgeResults` field (if loop completed) OR reconstructed from server logs (if process killed mid-loop)

## Litigation-hold-relevant emails

- **Patricia Singh ↔ HR ↔ Greco & Lin emails affected:** ☐ Confirmed yes    ☐ Confirmed no    ☐ Cannot determine
- **Time confirmation was reached:** ____
- **Source of truth for that determination:** _________________________________________

## Outstanding gaps in the timeline

> Where the team had to use "best estimate" instead of a logged fact. Each is a finding for the AAR.

- ___________________________________________________________________________________________
- ___________________________________________________________________________________________
- ___________________________________________________________________________________________
