/**
 * POST /api/analyze/[id]
 *
 * Runs the analysis phase for a given alert:
 * 1. VirusTotal OSINT enrichment (domain, IP, URLs)
 * 2. OpenRouter AI classification
 * 3. Updates the database with results
 * 4. Sets status to AWAITING_REVIEW
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrichWithOSINT } from "@/lib/virustotal";
import { analyzeEmail } from "@/lib/ai";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const alert = await db.phishingAlert.findUnique({ where: { id } });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (!alert.rawEmailHeaders && !alert.rawEmailBody) {
      return NextResponse.json(
        { error: "No email data available for analysis. Run ingestion first." },
        { status: 400 }
      );
    }

    // Parse stored data
    const headers = alert.rawEmailHeaders
      ? (JSON.parse(alert.rawEmailHeaders) as Record<string, string>)
      : {};
    const extractedLinks = alert.extractedLinks
      ? (JSON.parse(alert.extractedLinks) as string[])
      : [];

    // Step 1: OSINT Enrichment
    let osintResults;
    try {
      osintResults = await enrichWithOSINT({
        senderDomain: alert.vtSenderDomain ?? alert.actorEmail.split("@")[1] ?? "",
        senderIp: alert.vtSenderIp ?? null,
        extractedLinks,
      });
    } catch (osintError) {
      console.warn("OSINT enrichment failed:", osintError);
      osintResults = {
        senderDomain: alert.vtSenderDomain ?? "",
        senderDomainScore: null,
        senderIp: alert.vtSenderIp ?? null,
        senderIpScore: null,
        urlResults: [],
      };
    }

    // Step 2: AI Analysis
    let aiResult;
    try {
      aiResult = await analyzeEmail({
        headers,
        bodyText: alert.rawEmailBody ?? "",
        bodyHtml: "",
        extractedLinks,
        osint: osintResults,
      });
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      return NextResponse.json(
        { error: `AI analysis failed: ${String(aiError)}` },
        { status: 500 }
      );
    }

    // Step 3: Update the database
    const updated = await db.phishingAlert.update({
      where: { id },
      data: {
        vtSenderDomain: osintResults.senderDomain,
        vtSenderDomainScore: JSON.stringify(osintResults.senderDomainScore),
        vtSenderIp: osintResults.senderIp ?? undefined,
        vtSenderIpScore: JSON.stringify(osintResults.senderIpScore),
        vtUrlScores: JSON.stringify(osintResults.urlResults),
        aiClassification: aiResult.classification,
        aiConfidenceScore: aiResult.confidence_score,
        aiReasoning: aiResult.reasoning,
        status: "AWAITING_REVIEW",
      },
    });

    return NextResponse.json({
      message: "Analysis complete",
      alert: updated,
      osint: osintResults,
      ai: aiResult,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: `Analysis failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
