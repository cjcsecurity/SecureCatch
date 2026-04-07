/**
 * GET /api/alerts/[id]
 * Returns full details for a single phishing alert.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const alert = await db.phishingAlert.findUnique({ where: { id } });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Parse JSON fields for convenience
    const parsed = {
      ...alert,
      rawEmailHeaders: alert.rawEmailHeaders ? JSON.parse(alert.rawEmailHeaders) : null,
      extractedLinks: alert.extractedLinks ? JSON.parse(alert.extractedLinks) : [],
      vtSenderDomainScore: alert.vtSenderDomainScore ? JSON.parse(alert.vtSenderDomainScore) : null,
      vtSenderIpScore: alert.vtSenderIpScore ? JSON.parse(alert.vtSenderIpScore) : null,
      vtUrlScores: alert.vtUrlScores ? JSON.parse(alert.vtUrlScores) : [],
      purgeResults: alert.purgeResults ? JSON.parse(alert.purgeResults) : null,
    };

    return NextResponse.json({ alert: parsed });
  } catch (error) {
    console.error("Failed to fetch alert:", error);
    return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 });
  }
}
