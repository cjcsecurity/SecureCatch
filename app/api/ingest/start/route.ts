/**
 * POST /api/ingest/start
 *
 * Manual trigger endpoint for the phishing alert ingestion workflow.
 * 1. Fetches open phishing tickets from Jira
 * 2. Parses ticket descriptions to extract actor, reporter, date
 * 3. Queries Google Alert Center for the exact messageId
 * 4. Fetches the raw email via Gmail API
 * 5. Stores all data in the database as a PhishingAlert record
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchPhishingTickets, parseTicketDescription } from "@/lib/jira";
import { findAlertByActor, fetchEmailData } from "@/lib/google";

export async function POST() {
  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
    newAlerts: [] as string[],
  };

  try {
    // Step 1: Fetch open phishing tickets from Jira
    let tickets;
    try {
      tickets = await fetchPhishingTickets();
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to fetch Jira tickets: ${String(error)}` },
        { status: 500 }
      );
    }

    if (tickets.length === 0) {
      return NextResponse.json({
        message: "No phishing tickets found in Jira",
        ...results,
      });
    }

    // Step 2: Process each ticket
    for (const ticket of tickets) {
      try {
        // Check if we already have this ticket in the database
        const existing = await db.phishingAlert.findUnique({
          where: { jiraTicketId: ticket.id },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Parse the ticket description
        const parsed = parseTicketDescription(ticket.description);

        if (!parsed.actorEmail || !parsed.reportedByEmail) {
          results.errors.push(
            `Ticket ${ticket.key}: Could not parse actor/reporter from description`
          );
          continue;
        }

        // Create initial alert record
        const alert = await db.phishingAlert.create({
          data: {
            jiraTicketId: ticket.id,
            jiraTicketKey: ticket.key,
            jiraTicketUrl: ticket.url,
            jiraSummary: ticket.summary,
            actorEmail: parsed.actorEmail,
            reportedByEmail: parsed.reportedByEmail,
            activityDate: parsed.activityDate ?? undefined,
            status: "INGESTED",
          },
        });

        // Step 3: Query Alert Center for messageId
        let googleMessageId: string | null = null;
        let rfc2822MessageId: string | null = null;

        try {
          const alertResult = await findAlertByActor(parsed.actorEmail, parsed.activityDate);
          if (alertResult) {
            googleMessageId = alertResult.googleMessageId;
            rfc2822MessageId = alertResult.rfc2822MessageId;
          }
        } catch (alertError) {
          console.warn(`Alert Center lookup failed for ${ticket.key}:`, alertError);
          // Continue without alert center data — we can still try Gmail search
        }

        // Step 4: Fetch raw email via Gmail API
        if (googleMessageId) {
          try {
            const emailData = await fetchEmailData(googleMessageId, parsed.reportedByEmail);

            await db.phishingAlert.update({
              where: { id: alert.id },
              data: {
                googleMessageId: emailData.googleMessageId,
                rfc2822MessageId: emailData.rfc2822MessageId,
                rawEmailHeaders: JSON.stringify(emailData.headers),
                rawEmailBody: emailData.bodyText || emailData.bodyHtml,
                extractedLinks: JSON.stringify(emailData.extractedLinks),
                vtSenderDomain: emailData.senderDomain,
                vtSenderIp: emailData.senderIp ?? undefined,
                status: "ANALYZING",
              },
            });
          } catch (gmailError) {
            console.warn(`Gmail fetch failed for ${ticket.key}:`, gmailError);
            // Update status but keep the partial data
            await db.phishingAlert.update({
              where: { id: alert.id },
              data: {
                googleMessageId: googleMessageId ?? undefined,
                rfc2822MessageId: rfc2822MessageId ?? undefined,
                status: "INGESTED",
              },
            });
          }
        } else {
          // No Google message ID found — store what we have
          await db.phishingAlert.update({
            where: { id: alert.id },
            data: {
              rfc2822MessageId: rfc2822MessageId ?? undefined,
              status: "INGESTED",
            },
          });
        }

        results.processed++;
        results.newAlerts.push(ticket.key);
      } catch (ticketError) {
        results.errors.push(`Ticket ${ticket.key}: ${String(ticketError)}`);
      }
    }

    return NextResponse.json({
      message: `Ingestion complete. Processed ${results.processed} new alerts, skipped ${results.skipped} existing.`,
      ...results,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: `Ingestion failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
