# Dual-Build retrospective — `sprint/auth-tests-and-docs`

A candid record of using the `/dual-build` skill on this branch on 2026-05-05/06. Goal: make the bearer-token auth WIP shippable (docs, tests, startup check) without modifying the auth code itself. Writing this so future-me (or another contributor) has real numbers and gotchas, not just the marketing pitch.

## What `/dual-build` actually does, in one paragraph

Splits a multi-component task into ~equal Claude and Codex subtasks with disjoint file scopes, dispatches all builders in parallel inside isolated `git worktree` checkouts, then dispatches the OPPOSITE model to fresh-eyes review each diff (Claude reviews Codex; Codex reviews Claude). Orchestrator consolidates, asks for merge decisions, merges with `--no-ff`. The cross-review is the differentiator — different model families catch different bug classes.

## This run

**Task**: Document `SECURECATCH_API_TOKEN`, add a test framework + auth tests, add a startup env-var safety check. Auth code in `lib/auth/api-token.ts` and 5 wired routes are off-limits.

**Split** (file-disjoint, ~50/50):

| Task | Model | Files | What it produced |
|---|---|---|---|
| T1 docs | Codex | `.env.local.example`, `SETUP.md`, `README.md` | Bearer-token setup section, troubleshooting row, project-specific README |
| T2 tests | Claude | `package.json`, `package-lock.json`, `vitest.config.ts`, `tests/auth/*`, `tests/api/*` | Vitest 4 + 15 tests for `requireApiToken` and protected-route wiring |
| T3 startup check | Codex | `instrumentation.ts`, `lib/env-check.ts`, `tests/env-check.test.ts` | Fail-fast on missing/short token via Next 16 instrumentation hook + 7 tests |

## What worked

- **Disjoint scopes held.** Three branches merged with zero conflicts. The pre-flight discipline of nailing down `file_scope` per task was load-bearing.
- **Parallelism was real.** Three builders dispatched in one message, all returned in the same window. Slowest builder was T2 at ~4 minutes; the other two were sub-minute. Sequential would have been ~6 minutes minimum.
- **Cross-review caught real signal.** Reviewer for T2 verified the integration tests would actually fail if `requireApiToken(req)` were removed (i.e., not "test theatre"). Reviewer for T3 verified Next 16's instrumentation contract by reading `node_modules/next/dist/docs/` rather than recalling from training data.
- **Model-strength split paid off.** Codex on the mechanical/boilerplate work (docs prose, env-var enumeration), Claude on the work that needed judgment (which test runner, what to mock, what counts as wiring validation). Both produced clean output for their tasks.
- **End-to-end verification was clean.** After all merges: `npm test` → `Test Files 3 passed (3), Tests 22 passed (22)` in 749ms.

## What didn't work / caveats

- **Worktrees branch from HEAD, not the working tree.** Fifteen WIP files were uncommitted at the start, including the auth code that T2's tests needed to import. Builders launched into worktrees that didn't have any of it. I had to commit the WIP first (`a10563e`) before dispatching. **This is the single biggest pre-flight check** — the skill doc mentions worktrees but doesn't flag this trap.
- **Codex's worktree git operations are fragile.** T1's Codex builder reported "`git add` failed on the worktree git metadata path and the escalation to stage files was rejected." It produced correct file changes but couldn't commit them. I committed on its behalf. T3's Codex builder committed fine. Inconsistent behavior across runs in the same workflow — worth knowing.
- **Cross-reviewers can be confidently wrong.** Codex's review of T3 flagged `JIRA_CSIRT_EMAIL` as "referenced nowhere in the codebase" — but it's used in `lib/jira.ts:46-48` and even throws if unset. I caught this only because I'd grepped the codebase earlier in Stage 0. **Don't apply reviewer findings blindly. Verify Critical/Important findings against ground truth before acting.** This was the run's biggest near-miss; without verification I would have removed a real, used env var from the warning list.
- **Reviewers run read-only.** Claude-reviewer of T2 noted "could not complete `npm test` because Vitest failed creating a temp dir under `/tmp`; escalation was not approved." So runtime verification of T2's tests didn't happen at the review step — it happened later, when the orchestrator (me) ran `npm test` post-merge. Plan for the orchestrator to be the final test-running step, not the reviewers.
- **Worktree base drift.** T2's builder rebased its worktree onto `sprint/auth-tests-and-docs` mid-task to pick up the auth helper. T1 and T3 stayed on the original base (`c8cf263`). All three merged cleanly because file scopes were disjoint, but the inconsistent base state is something to watch — if a task DID need files only present on the newer base, the builder would silently fail.

## Numbers

| Metric | Value |
|---|---|
| Subtasks | 3 |
| Builder agents | 3 (1 Claude, 2 Codex) |
| Reviewer agents | 3 (2 Claude, 1 Codex) |
| Orchestrator overhead | 1 commit pre-build + 3 merge commits + final test run |
| Wall time, slowest builder | ~4 min (T2) |
| Wall time, slowest reviewer | ~5 min (T2 reviewer, due to sandbox issue) |
| Tests added | 22 |
| Files changed across all merges | 11 (3 docs, 5 test/config, 3 startup-check) |
| Merge conflicts | 0 |
| False-positive findings | 1 (JIRA_CSIRT_EMAIL claim by T3 reviewer) |
| Critical findings | 0 |
| Important findings | 1 (the false positive) |

## Lessons for next time

1. **Run `git status` and commit/stash WIP before invoking `/dual-build`.** Worktrees won't see your uncommitted work. The skill doc could be more explicit about this — file an issue if you maintain the skill repo.
2. **Brief the file scope obsessively.** Disjointness is what makes parallelism safe. The brief should list every file each task may touch and explicitly forbid the rest.
3. **Verify reviewer findings before acting.** Run a quick grep / read against the claim. The Codex reviewer was confident and wrong about `JIRA_CSIRT_EMAIL` — same model that would normally be reliable can hallucinate negative claims ("X is referenced nowhere").
4. **Plan for the orchestrator to be the final test runner.** Reviewers operate read-only; they can't always run the test suite. Don't skip post-merge `npm test`.
5. **Codex worktree commits are flaky.** Be ready to commit on a Codex builder's behalf if its agent reports a `git add` failure. Don't assume the change is lost — the file edits are usually present.
6. **One concrete project-quality win**: cross-review forced both builders to actually verify their Next 16 assumptions against `node_modules/next/dist/docs/` rather than relying on training data. That's how T2 ended up using Vitest 4's native `tsconfigPaths` instead of the deprecated `vite-tsconfig-paths` plugin, and how T3 confirmed instrumentation is stable in 16.2 with no `next.config.ts` opt-in. Both findings were doc-cited.

## Would I use it again on this codebase?

Yes, for tasks of this shape — multi-component, file-disjoint, where cross-validation has real value. Not for single-file changes (overhead dominates), not for tightly-coupled refactors (can't get disjoint scopes), not for time-sensitive fixes (wall time is minutes not seconds). For "make this WIP shippable" type work, where the components are inherently parallel (docs + tests + startup hook), it was a clean fit.

The honest answer on cost: ~8 model calls + orchestrator = real token spend. The cross-review caught zero critical issues on this run (the one Important finding was a false positive). On its own that suggests the workflow was overkill for this task. But it also produced a verifiably correct merge with 22 passing tests on the first try, and the discipline of writing crisp briefs with file-scope constraints made each task sharper than it would have been in a single-agent thread. I'd run it again on similar work.

## Final state

```
88a43cf merge: T3 startup env-var safety check
99b2a7a merge: T2 vitest framework + auth tests
f6285a4 merge: T1 docs for SECURECATCH_API_TOKEN
c85fe8e feat(T3): add startup env-var safety check via instrumentation hook
7a56192 docs: document SECURECATCH_API_TOKEN and bearer-token auth
b458606 test: add vitest runner with auth-token and protected-route tests
a10563e feat: bearer-token auth layer and security hardening
```
