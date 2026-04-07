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

type RemediateAction = "REMEDIATE" | "CLOSE";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { action: RemediateAction; note?: string };
  const { action, note } = body;

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

    if (action === "REMEDIATE") {
      return await handleRemediate(alert, note);
    } else {
      return await handleClose(alert, note);
    }
  } catch (error) {
    console.error("Remediation error:", error);
    return NextResponse.json(
      { error: `Remediation failed: ${String(error)}` },
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
  if (!alert.rfc2822MessageId) {
    return NextResponse.json(
      { error: "No RFC 2822 Message-ID available for domain-wide search. Run ingestion first." },
      { status: 400 }
    );
  }

  // Step 1: Get all domain users
  let allUsers: string[] = [];
  try {
    allUsers = await listAllDomainUsers();
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to list domain users: ${String(error)}` },
      { status: 500 }
    );
  }

  // Step 2: Search each user's inbox and trash the malicious email
  const affectedUsers: string[] = [];
  let usersSearched = 0;

  for (const userEmail of allUsers) {
    const found = await trashMessageForUser(userEmail, alert.rfc2822MessageId);
    usersSearched++;
    if (found) {
      affectedUsers.push(userEmail);
    }
  }

  const purgeResults = { usersSearched, usersAffected: affectedUsers };

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
Executed domain-wide search for RFC2822 Message-ID: ${alert.rfc2822MessageId}
Message successfully trashed from ${affectedUsers.length} affected user inbox(es) out of ${usersSearched} users searched.
Affected users: ${affectedUsers.length > 0 ? affectedUsers.join(", ") : "None found"}
${note ? `\nAnalyst Note: ${note}` : ""}`;

  try {
    await postJiraComment(alert.jiraTicketKey, jiraComment);
    await closeJiraTicket(alert.jiraTicketKey);
  } catch (jiraError) {
    console.warn("Jira update failed (non-fatal):", jiraError);
    // Continue — the purge already happened
  }

  // Step 4: Update the database
  const updated = await db.phishingAlert.update({
    where: { id: alert.id },
    data: {
      analystAction: "REMEDIATE",
      analystNote: note ?? null,
      status: "REMEDIATED",
      remediatedAt: new Date(),
      purgeResults: JSON.stringify(purgeResults),
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

  try {
    await postJiraComment(alert.jiraTicketKey, jiraComment);
    await closeJiraTicket(alert.jiraTicketKey);
  } catch (jiraError) {
    console.warn("Jira update failed (non-fatal):", jiraError);
  }

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
