# Gaps & Findings — Burning the Inbox

> Capture issues surfaced during the exercise. Each finding becomes a candidate action item. Be specific — *"comms was bad"* is not a finding; *"comms had no template for a dual internal-and-external bad-news email; spent 11 minutes drafting from scratch"* is.

## Findings

### Finding 1
- **What was missing / slow / ambiguous:**
  ___________________________________________________________________________________________
  ___________________________________________________________________________________________
- **When it surfaced (T+ time):** ____
- **Who noticed:** _____________________________________
- **Severity:** ☐ Critical (blocks response)  ☐ High (slows response)  ☐ Medium  ☐ Low
- **Suggested action:**
  ___________________________________________________________________________________________
- **Suggested owner:** _________________________________

### Finding 2
- **What was missing / slow / ambiguous:**
  ___________________________________________________________________________________________
- **When it surfaced (T+ time):** ____
- **Who noticed:** _____________________________________
- **Severity:** ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Suggested action:**
  ___________________________________________________________________________________________
- **Suggested owner:** _________________________________

### Finding 3
- **What was missing / slow / ambiguous:**
  ___________________________________________________________________________________________
- **When it surfaced (T+ time):** ____
- **Who noticed:** _____________________________________
- **Severity:** ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Suggested action:**
  ___________________________________________________________________________________________
- **Suggested owner:** _________________________________

### Finding 4
- **What was missing / slow / ambiguous:**
  ___________________________________________________________________________________________
- **When it surfaced (T+ time):** ____
- **Who noticed:** _____________________________________
- **Severity:** ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Suggested action:**
  ___________________________________________________________________________________________
- **Suggested owner:** _________________________________

### Finding 5
- **What was missing / slow / ambiguous:**
  ___________________________________________________________________________________________
- **When it surfaced (T+ time):** ____
- **Who noticed:** _____________________________________
- **Severity:** ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Suggested action:**
  ___________________________________________________________________________________________
- **Suggested owner:** _________________________________

## Candidate findings (pre-listed — check all that surfaced in the room)

> These are common findings the runbook is *designed* to surface. Tick any that came up in your exercise; the AAR companion will weave these in.

- [ ] **No graceful abort signal in the remediate route** — once `Approve & Remediate` starts, the only way to stop it is `kill -9` the Node process
- [ ] **`purgeResults` audit trail only writes after the loop completes** — killing the process mid-run loses the per-user record of what was trashed
- [ ] **Kill switch (`FEATURE_FLAGS.disable_approve_remediate`) was added in `7d3f1ac` but never plumbed into the route handler** — and no test caught it
- [ ] **AI enrichment normalizes Message-IDs in a way that can collide with legitimate automated emails** — risk surface created by an upstream component
- [ ] **No comms template for "destructive action with overscoped blast radius"** — team had to draft internal + customer + press messaging from scratch
- [ ] **Authority to take SecureCatch offline (503) was not pre-defined** — discovered by trying
- [ ] **Litigation-hold awareness in the engineering team was thin** — sworn-timeline deliverable was not understood until GC explained it
- [ ] **Helpdesk did not have a saved search / filter for "missing email" tickets** — manual triage to detect the pattern
- [ ] **No pre-baked customer-facing template for "your alert workflow shared a mailbox we touched"** — risk of overpromising or contradicting a later RCA
- [ ] **TechCrunch DM channel** (CISO's Twitter) was not on the comms team's monitoring list — discovered post-hoc
- [ ] **The SOC analyst's session state was not preserved** — the open browser tabs at moment-of-click were closed before forensics could capture them
- [ ] Other (specify): _____________________________________________________________

## Themes surfaced in the hotwash

> What patterns emerged across multiple findings? Each theme often becomes a workstream in the AAR.

- ___________________________________________________________________________________________
- ___________________________________________________________________________________________
- ___________________________________________________________________________________________

## Three things to start, three to stop, three to keep

**Start:**
1. _________________________________________________________________________________
2. _________________________________________________________________________________
3. _________________________________________________________________________________

**Stop:**
1. _________________________________________________________________________________
2. _________________________________________________________________________________
3. _________________________________________________________________________________

**Keep:**
1. _________________________________________________________________________________
2. _________________________________________________________________________________
3. _________________________________________________________________________________
