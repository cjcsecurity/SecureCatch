import { describe, expect, it } from "vitest";
import { evaluateRemediationPolicy } from "../lib/remediation-policy";

const base = {
  action: "REMEDIATE" as const,
  status: "AWAITING_REVIEW",
  ticketKey: "SECOPS-42",
  confirmation: "SECOPS-42",
  destructiveActionsEnabled: true,
  hasAnalysis: true,
};

describe("remediation policy", () => {
  it("requires completed analysis", () => {
    expect(evaluateRemediationPolicy({ ...base, hasAnalysis: false })).toMatchObject({ ok: false, status: 409 });
  });

  it("requires the server-side destructive action gate", () => {
    expect(evaluateRemediationPolicy({ ...base, destructiveActionsEnabled: false })).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("requires an exact ticket-key confirmation", () => {
    expect(evaluateRemediationPolicy({ ...base, confirmation: "SECOPS-41" })).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("claims valid remediation before side effects", () => {
    expect(evaluateRemediationPolicy(base)).toEqual({
      ok: true,
      status: 200,
      claimedStatus: "REMEDIATING",
    });
  });

  it("allows a reviewed alert to close without enabling destructive actions", () => {
    expect(
      evaluateRemediationPolicy({
        ...base,
        action: "CLOSE",
        confirmation: undefined,
        destructiveActionsEnabled: false,
      })
    ).toEqual({ ok: true, status: 200, claimedStatus: "CLOSING" });
  });
});
