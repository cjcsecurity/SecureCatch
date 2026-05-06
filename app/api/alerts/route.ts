/**
 * GET /api/alerts
 * Returns all phishing alerts for the dashboard queue.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiToken } from "@/lib/auth/api-token";

export async function GET(req: NextRequest) {
  const denied = requireApiToken(req);
  if (denied) return denied;
  try {
    const alerts = await db.phishingAlert.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        jiraTicketKey: true,
        jiraTicketUrl: true,
        jiraSummary: true,
        actorEmail: true,
        reportedByEmail: true,
        activityDate: true,
        googleMessageId: true,
        rfc2822MessageId: true,
        aiClassification: true,
        aiConfidenceScore: true,
        status: true,
        analystAction: true,
        remediatedAt: true,
        closedAt: true,
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
