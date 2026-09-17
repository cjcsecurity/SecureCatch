/**
 * POST /api/remediate/[id]
 *
 * Handles analyst remediation actions:
 * - action: "REMEDIATE" — Domain-wide purge (trash email from all user inboxes) + close Jira ticket
 * - action: "CLOSE"     — Mark as safe/false positive + close Jira ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postJiraComment, closeJiraTicket } from "@/lib/jira";
import { listAllDomainUsers, trashMessageForUser } from "@/lib/google";
import { authorizeApiRequest } from "@/lib/auth";
import { evaluateRemediationPolicy, type RemediateAction } from "@/lib/remediation-policy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeApiRequest(request, { mutation: true });
  if (denied) return denied;

  const { id } = await params;
  let body: { action?: unknown; note?: unknown; confirmation?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; note?: unknown; confirmation?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const action = body.action as RemediateAction;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : undefined;
  const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : undefined;

  if (!action || !["REMEDIATE", "CLOSE"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'REMEDIATE' or 'CLOSE'" },
      { status: 400 }
    );
  }

  try {
    const alert = await db.phishingAlert.findUnique({ where: { id } });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (action === "REMEDIATE" && !alert.rfc2822MessageId) {
      return NextResponse.json(
        { error: "No RFC 2822 Message-ID is available. Run ingestion again before remediation." },
        { status: 409 }
      );
    }

    const policy = evaluateRemediationPolicy({
      action,
      status: alert.status,
      ticketKey: alert.jiraTicketKey,
      confirmation,
      destructiveActionsEnabled: process.env.SECURECATCH_ENABLE_DESTRUCTIVE_ACTIONS === "true",
      hasAnalysis: Boolean(alert.aiClassification && alert.aiReasoning),
    });
    if (!policy.ok || !policy.claimedStatus) {
      return NextResponse.json({ error: policy.message }, { status: policy.status });
    }

    const claimed = await db.phishingAlert.updateMany({
      where: { id, status: "AWAITING_REVIEW" },
      data: { status: policy.claimedStatus },
    });
    if (claimed.count !== 1) {
      return NextResponse.json(
        { error: "This alert is already being handled or its state changed. Refresh before retrying." },
        { status: 409 }
      );
    }

    if (action === "REMEDIATE") {
      return await handleRemediate(alert, note);
    } else {
      return await handleClose(alert, note);
    }
  } catch (error) {
    console.error("Remediation error:", error);
    try {
      await db.phishingAlert.updateMany({
        where: { id, status: { in: ["REMEDIATING", "CLOSING"] } },
        data: { status: "ACTION_FAILED" },
      });
    } catch (statusError) {
      console.error("Failed to record action failure:", statusError);
    }
    return NextResponse.json(
      { error: "Action failed. Review server logs before attempting any manual follow-up." },
      { status: 500 }
    );
  }
}

async function handleRemediate(
  alert: {
    id: string;
    jiraTicketKey: string;
    rfc2822MessageId: string | null;
    actorEmail: string;
    aiClassification: string | null;
    aiConfidenceScore: number | null;
    aiReasoning: string | null;
  },
  note?: string
) {
  const messageId = alert.rfc2822MessageId;
  if (!messageId) {
    throw new Error("Remediation reached execution without an RFC 2822 Message-ID");
  }

  // Step 1: Get all domain users
  const allUsers = await listAllDomainUsers();

  // Step 2: Search each user's inbox and trash the malicious email
  const affectedUsers: string[] = [];
  const failedUsers: string[] = [];
  let usersSearched = 0;

  for (const userEmail of allUsers) {
    const result = await trashMessageForUser(userEmail, messageId);
    usersSearched++;
    if (result === "trashed") {
      affectedUsers.push(userEmail);
    } else if (result === "error") {
      failedUsers.push(userEmail);
    }
  }

  const purgeResults = { usersSearched, usersAffected: affectedUsers, usersFailed: failedUsers };

  // Persist the purge outcome before updating Jira so partial external work is
  // visible even if a later step fails.
  await db.phishingAlert.update({
    where: { id: alert.id },
    data: {
      analystAction: "REMEDIATE",
      analystNote: note ?? null,
      purgeResults: JSON.stringify(purgeResults),
    },
  });

  if (failedUsers.length > 0) {
    throw new Error(`Domain-wide purge could not verify ${failedUsers.length} mailbox(es)`);
  }

  // Step 3: Post Jira comment and close ticket
  const aiSummary = alert.aiClassification
    ? `Classification: ${alert.aiClassification} (${alert.aiConfidenceScore}% confidence)\n${alert.aiReasoning ?? ""}`
    : "AI analysis was not completed.";

  const jiraComment = `Domain-wide purge executed. Triaged in SecureCatch dashboard, reviewed headers.
> checked OSINT on IoCs
> identified extent of compromise

*Results*
${aiSummary}

*Follow up actions taken*
Executed domain-wide search for RFC2822 Message-ID: ${messageId}
Message successfully trashed from ${affectedUsers.length} affected user inbox(es) out of ${usersSearched} users searched.
Affected users: ${affectedUsers.length > 0 ? affectedUsers.join(", ") : "None found"}
${note ? `\nAnalyst Note: ${note}` : ""}`;

  await postJiraComment(alert.jiraTicketKey, jiraComment);
  await closeJiraTicket(alert.jiraTicketKey);

  // Step 4: Update the database
  const updated = await db.phishingAlert.update({
    where: { id: alert.id },
    data: {
      analystAction: "REMEDIATE",
      analystNote: note ?? null,
      status: "REMEDIATED",
      remediatedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: `Domain-wide purge complete. Trashed email from ${affectedUsers.length} user(s) out of ${usersSearched} searched.`,
    alert: updated,
    purgeResults,
  });
}

async function handleClose(
  alert: {
    id: string;
    jiraTicketKey: string;
    aiClassification: string | null;
  },
  note?: string
) {
  // Post false positive comment to Jira
  const jiraComment = `Ticket closed as false positive via SecureCatch dashboard.
Classification: ${alert.aiClassification ?? "Not analyzed"}
${note ? `\nAnalyst Note: ${note}` : ""}
No remediation actions taken.`;

  await postJiraComment(alert.jiraTicketKey, jiraComment);
  await closeJiraTicket(alert.jiraTicketKey);

  const updated = await db.phishingAlert.update({
    where: { id: alert.id },
    data: {
      analystAction: "CLOSE",
      analystNote: note ?? null,
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "Alert closed as false positive",
    alert: updated,
  });
}
