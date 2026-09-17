export type RemediateAction = "REMEDIATE" | "CLOSE";

interface RemediationPolicyInput {
  action: RemediateAction;
  status: string;
  ticketKey: string;
  confirmation?: string;
  destructiveActionsEnabled: boolean;
  hasAnalysis: boolean;
}

export interface RemediationPolicyResult {
  ok: boolean;
  status: number;
  message?: string;
  claimedStatus?: "REMEDIATING" | "CLOSING";
}

export function evaluateRemediationPolicy(input: RemediationPolicyInput): RemediationPolicyResult {
  if (input.status !== "AWAITING_REVIEW" || !input.hasAnalysis) {
    return {
      ok: false,
      status: 409,
      message: "Complete analysis and return the alert to AWAITING_REVIEW before taking action.",
    };
  }

  if (input.action === "REMEDIATE") {
    if (!input.destructiveActionsEnabled) {
      return {
        ok: false,
        status: 409,
        message: "Destructive remediation is disabled on this server.",
      };
    }
    if (input.confirmation !== input.ticketKey) {
      return {
        ok: false,
        status: 400,
        message: `Type ${input.ticketKey} exactly to authorize the domain-wide purge.`,
      };
    }
    return { ok: true, status: 200, claimedStatus: "REMEDIATING" };
  }

  return { ok: true, status: 200, claimedStatus: "CLOSING" };
}
